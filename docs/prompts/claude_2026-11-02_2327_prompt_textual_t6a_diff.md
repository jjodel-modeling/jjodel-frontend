# Textual syntax T6a: from an edited text to a minimal diff on an existing model (no UI)

Prompt-ID: P-2026-11-02-2327
Chat: C-2026-11-02-1814
Front: codegen
Status: da eseguire
Lane: full (new engine module; writes to models through JjScript)
Depends: none
Worktree: ~/jjodel-w-textt6a, branch textual-t6a (from the trunk commit that adds this prompt)
Request: none (Alfonso 2026-11-02 22:54: the notation is closed only when an existing model can be edited from text)

Before anything else run pwd, git branch --show-current and git status --short; if the tree is not ~/jjodel-w-textt6a on
textual-t6a and clean, stop with Outcome: blocked. Every reply opens with [P-2026-11-02-2327 · session <id>]. No subagents, no
background tasks. One probe run per tool call. Never cat a gate log. Commit as soon as the gates are green; commit early, this
front has hit the context ceiling often. If you approach it, commit what is green and write the handoff.

## COSA

The engine of step T6, with no editor wiring (that is T6b). Given the model's current objects and a parse of an edited text:

1. Match parsed objects to model objects: the previous print's spans when given (R-TXT-22), then class and name in the same
   container, homonyms by order and marked uncertain (R-TXT-18). Cascade steps 3 and 4 (moves, renames by similarity): a parsed
   object that only they could match is reported as uncertain, not applied. Moves and reorder are T7. Ids in the text are T8.
2. Compute a minimal diff: create, update attribute, update reference, delete. An unchanged text yields an empty diff. A
   text differing only in the order of an unordered feature yields an empty diff (R-TXT-21 (5)). What the notation does not
   show is preserved, never cleared; an omitted unset attribute reads back as unset (R-TXT-19).
3. Refuse to apply, returning the reasons, unless all of R-TXT-26 hold: no parse errors (`isApplicableParse`), no uncertain
   match, no deletion of an object another model references; and no unprinted objects (`hasUnprinted`, R-TXT-30).
4. A value the model reads through a default (`emptyAttributeDefault`, a mandatory enum left empty) must not count as a change
   when the text prints that default: applying must not write it unasked. See the ticket of P-2026-11-02-2113. Test it.
5. Render the diff as JjScript lines, addressing by handles registered before the run (`executor/handleRegistry.ts`, R-TXT-21
   (6)), and run it as one undo step through the path "New model from text" uses. Read `docs/discovery/discovery_2026-11-01_textual_viewpoint.md` §A.5 first.

Keep the first three parts pure, on plain objects, so they test without the app.

## Generality

No hardware concept in code or tests. Do not read ~/Downloads/micron-proto. Acceptance on the library fixture of
`syntaxRecord.test.ts` and on one saved example from another domain, with and without annotations (renamed and dropped keywords,
a group, an inline feature).

## DOVE

New modules in `frontend/src/codegen/textual/`, their tests; `modelLines.ts` if the lines need it. Any other file, and any change
to the JjScript planner or executor: a question with Recommended:. Critical zone out of scope: stop.

## COME

Tests first: round-trip property (print, parse, diff is empty) over the shared corpus; edit an attribute; edit a reference; add and
delete an object, also nested; a rename with an unchanged body, reported uncertain or matched, state which and why; homonyms;
every refusal of point 3; point 4. Then apply on a real project state, undo once, compare the state with the one before.
Mutation bench in the commit body, at least: order-insensitive compare removed; refusal on uncertain removed; default counted as
a change; preserved-hidden-feature cleared; no undo group.

No visual check: no UI here.

## HARD STOP

Outcome: question on an exported interface that breaks outside this lane or an amendment to an R- row. Outcome: hard-stop at the
context ceiling, after the handoff.

## Gates and closure

From frontend/, one tool call each, through node scripts/run-quiet.mjs LABEL -- CMD: npx tsc --noEmit; npx vitest run src/codegen;
npm run build; npm run check:docs; npm run check:codegen-lazy (both modes). Commit feat(codegen): diff an edited text against
its model (P-2026-11-02-2327), trailer Model:. Log entry in docs/log-inbox/codegen.md and the Status: flip in one docs-only
commit. No push, no merge. Final message: Decisions taken (unattended), Decisions awaiting Alfonso, then Outcome:.
