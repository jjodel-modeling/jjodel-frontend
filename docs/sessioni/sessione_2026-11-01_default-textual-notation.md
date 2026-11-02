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
