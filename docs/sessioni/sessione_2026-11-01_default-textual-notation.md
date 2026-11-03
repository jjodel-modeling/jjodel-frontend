# Session 2026-11-01: default textual notation (chat C-2026-11-01-1713)

## State at end of session

Discovery P-2026-11-01-1709 done and merged on `alfonso-frontend-jjtl` (merge 5b069a615, Status flip and log e841d8472).
No code changed. The proposal and the review of rules D1 to D7 wait for Alfonso (ten questions below). Worktree
`~/jjodel-w-defaulttext` (branch `default-textual-notation`) is merged and can be removed.

## Decisions taken

- 2026-11-01 17:15: the prototype's request (`~/Downloads/micron-proto/prompts/P-2026-11-01-1709-jjgen-default-textual-notation.md`)
  rewritten as a trunk discovery, keeping its Prompt-ID; two questions added (unset vs default, uniqueness of names) and
  the overrides question pointed at the existing metaclass dispatch.
- 2026-11-01 17:20: Alfonso asked for everything to run in `/lane auto`.
- Unattended: GO to finish the report after the lane's hard-stop (it had not committed); Status flip by direct edit
  instead of the `/status-flip` skill; merge with `--direct` (docs-only, preconditions held).

## Findings (report `docs/discovery/discovery_2026-11-01_default_textual_notation.md`)

1.1 partly: the class shell carries attributes and references, but `DClass.features` is empty after an Ecore import.
1.2 holds: `o["f"]` reads every feature on every model-object surface; the 2026-06-11 finding no longer holds; an index
read carries no origin (`evaluator.ts:1163-1176`). 1.3 partly: an enum literal is a plain string, told apart only by the
attribute's type. 1.4 partly: unset is visible only for optional attributes without a default. 1.5: Text is opaque by
design; no way to test it for emptiness. 1.6: names are not unique. Side finding: the Ecore import drops
`defaultValueLiteral` and literal values.

## Questions for Alfonso (report §5, recommendation first)

1. D6: supertypes' features first, then the class's own.
2. D3: strings always quoted.
3. D1/D3: class names and literals as declared.
4. D5: a non-unique or nameless target as a containment path.
5. D2: accept «reads null / empty list» as unset, or a lane for `isSet(o, f)`.
6. `o["f"]` notifies `readObserver` like `o.f` (JjEL lane), so reflective output stays traceable.
7. First deliverable: a shipped JjEL generator, not a built-in `defaultText`.
8. Per-class overrides through the existing metaclass dispatch.
9. D7: contextual keywords.
10. Ticket the Ecore import's lost `defaultValueLiteral` and literal values.

## Claude Code prompts

- P-2026-11-01-1709 discovery: ✅ (f910decbc), one resume after hard-stop.
- P-2026-11-01-1743 merge --direct: ✅ (5b069a615).

## Next steps

Alfonso answers the ten questions; then, if agreed, a lane for item 6 (JjEL, origin of index reads) and one for the
JjEL default generator. The codegen front is owned by chat C-2026-10-23-2009: decide whether the follow-up stays here.

## Update 20:12

Alfonso ratified the ten questions (19:39): R-TXT-1..10 in docs/decisions.md (404452168); ticket #395 (71aee8fde).
P-2026-11-01-1945 (index read traced): partial, reads now reach the reads list but an index hole still has no model origin (origin.ts:199); merged 9e19ecbab.
P-2026-11-01-1946 (shipped JjEL generator, frontend/src/examples/codegen/default-text.generator.json): done, merged 0e5d9152d; runs on the fixture, CoreSpec and ArbiterSpec.

Open for Alfonso: (a) a short origin.ts lane for index holes; (b) a declarative notation model (textual viewpoint) as the final mechanism, the JjEL generator being the reference implementation of R-TXT; (c) keep ref(o, r, t) and the [k] root prefix; (d) record the R-TXT-1 tie-break between sibling supertypes; (e) R-TXT-5 is tested on a mock handle only, one in-app check needed.

## Night 2026-11-01/02 (/lane auto, Alfonso asleep from 23:50)

Decisions ratified before the night: R-TXT-16..24 (three-level syntax, model as source of truth, identity, application,
comments, the ten answers of the addendum, identity inside the editor, the textual entry as a viewpoint-like entry,
top level and single containment). The codegen front is owned by this chat (C-2026-11-01-1713).

Landed on `alfonso-frontend-jjtl`, in order: textual syntax addendum (merge ddf1088d9); Ecore import keeps defaults and
literal values (44c6794f2); T1 base grammar, C-like style and printer (3166319dd); Ecore export of defaults, literal
labels and serializable on import (6b2bfeb36); JjEL reads the declared default literal (4383c2572); T3 style checks
(3008d69b5); T2 in three slices, parser (45c883e92), textual entry and read-only Text tab (7bd41e3cf), New model from
text (edf047bf3), merged as aa68ad049. T2b and T2c each hit the context ceiling once and were closed by continuation
lanes (RC-51). Tickets opened: #403 (XMI import), #408 (JjGen call-argument origins).

Adopted unattended (RC-21): the textual entry shows only with the code-generation setting on (R-GEN-2); the canvas of a
model created from text opens inside the undo group, so that one undo removes it.

Open for Alfonso: see the morning digest in the chat (twelve questions with recommendations).

## Morning 2026-11-02

Ratified: R-TXT-25 (the twelve answers of the night digest, 06:43) and R-TXT-26 (an edited text is applied on a pause,
only when clean, 08:34).

Landed on `alfonso-frontend-jjtl`: unambiguous paths `Class[k]`/`feature[k]`, fold fallback on style words, shared
test corpus (b7c0adfc2); undo of «Create model» closes the canvas tab and Text tabs have an app-bar badge (41c7c0d8a);
`defaultValueLiteral` accessors restored, decimals refused on integer defaults, lazy gate off mode independent of
`.env.production` (247007a7b); JjScript M1 `set` with lists and enumeration literals, `modelLines` no longer blocks
many-valued attributes (a53423995, after P-2026-11-02-0855 took the trunk); codegen imports guarded so the lazy gate is
green in both modes (e684fef6c).

T4 is split (RC-52): T4a-1 (annotations as data and their application in derivation, printer, parser; acceptance on
the 16 Briefs), T4a-2 (storage in `_state`, wiring, language-name label), T4b (the form). P-2026-11-02-0846 wrote the
T4a-1 design in `~/.jjodel-lanes/P-2026-11-02-0846/handoff.md` and stopped at the context ceiling; its continuation
waits for two answers from Alfonso: (1) `CoreSpec.ecore` declares `Instruction.mnemonic [0..1]`, so R-TXT-21 (4) refuses
the RISC-V grouping (recommended: `[1..1]` in the prototype's metamodel); (2) a one-line class without block reads the
next word as its name (recommended: the annotation requires a mandatory name, not a notice).

Next: T4a-1 continuation, T4a-2, T4b, then T6 (apply edits on pause, R-TXT-26). Other open points: a quoted string on
an enum attribute is not checked against the literals; redo after the undo of a model creation does not reopen its tab;
a model's Text tab stays hidden when its model disappears.

Later on 2026-11-02: R-TXT-27 ratified (09:52); T4a-1 landed, syntax annotations as data applied in grammar, printer and parser, LL(1) check of annotated grammars, the 16 Briefs reproduced (merge c41033a9a). The prototype metamodels need `Instruction.mnemonic [1..1]` (CoreSpec) and `Requester.name [1..1]` (ArbiterSpec), outside Jjodel. Next: T4a-2 (storage in `_state`, language-name label), T4b (form), T6 (apply on pause, R-TXT-26).

## Night 2026-11-02/03 (/lane auto; chat C-2026-11-02-1814 owns the front from 2026-11-02 18:18)
Alfonso 22:54: the notation is closed only when an existing model can be edited from text. RISC-V was the litmus test, not the target: acceptance moved to non-hardware metamodels.
Landed on `alfonso-frontend-jjtl`: T4a-2, annotations stored in `_state` under `textSyntax`, language name (4233db8e5); R-TXT-28 paths follow class keywords (45b02a390); R-TXT-29 paths follow feature keywords, index in print order (1a5e905b0); R-TXT-30 report of unprinted objects (2951a72a6); T6a diff engine (b0bfeb221); T6b editable Text tab, apply on a pause, confirm panel, one undo (merge of P-2026-11-03-0543).
Open for Alfonso: (1) a stale edit stays blocked after an external model change, Reprint discards it (recommended: keep); (2) `ordered` flag in `metamodel.ts`: today no feature is ordered (recommended: with T7); (3) printer defect: a single-valued reference to an object outside the text prints no value, so the text does not parse and such a model cannot be edited as text; the model stays untouched (recommended: a small fix before T7, whatever the cross-model reference work does); (4) nine test files red at import before and after these merges, in src/jjtl, src/jjscript and UDComparator: is a ticket covering them?; (5) retire the worktrees of this front (needs his yes); (6) push.
Covered by unit tests only, not in the app: deleting a cross-model target, unprinted objects, a move refusal. The probe diagram edit was a direct model write, not a canvas click. Visual checks were run by the chat.
Next: T7 (moves, reorder; needs JjScript planner support for M1 move, outside codegen), T8, T4b, T9, T10. Not started: T7 waits for the answers above.
