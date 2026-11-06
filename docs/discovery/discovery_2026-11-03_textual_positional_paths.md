# Discovery 2026-11-03 — textual notation: positional paths after a move or reorder

- Prompt-ID: P-2026-11-03-1356 (`docs/prompts/` file of this prompt, committed in `abec5f035`)
- Chat: C-2026-11-03-1037; depends on P-2026-11-03-1321 (handoff `~/.jjodel-lanes/P-2026-11-03-1321/handoff.md`)
- Session: id not exposed to the session (`$CLAUDE_SESSION_ID` empty)
- Tree: `~/jjodel-w-textt7`, branch `textual-t7`, measured on `d2125a90f` code (HEAD `abec5f035`, prompt commit);
  tests committed in `d23d39e7f`
- Executor: claude-opus-5-5 (Opus 5.5)

This report is a set of hypotheses with evidence, not a reference. Whoever uses it downstream rereads the real files.

## Goal

A reference to an object with no name prints as a containment path (R-TXT-4), e.g. `fires State[0].transitions[1]`.
R-TXT-32 forbids re-resolving by position for targets outside the text; R-TXT-22 keeps identity on a move. Measure what
the plan does to an incoming path reference whose text the user did not retype, after five edits of the indexed list.

## Hypotheses

1. **H1: the parser resolves a path against the edited text, by position.** Holds (read and measured).
2. **H2: the diff compares references by resolved target, never by the token as printed.** Holds (read).
3. **H3: each of the five edits (a)-(e) retargets the reference silently**, with no refusal and no uncertain match.
   Holds for all five (measured).
4. **H4: when the old index no longer exists, the edit is refused, not retargeted.** Holds (measured, probe e2 below):
   a parse error refuses.

## Files read

- `frontend/src/codegen/textual/parser.ts` (window 586-675)
- `frontend/src/codegen/textual/printer.ts` (windows 165-191)
- `frontend/src/codegen/textual/textDiff.ts` (window 1-250)
- `frontend/src/codegen/textual/__tests__/textDiff.test.ts` (windows 126-200, 293-320, 518-729)
- `~/.jjodel-lanes/P-2026-11-03-1321/handoff.md`

## Findings

**F1 (read): the printer writes a path from positions in the print.** `printer.ts:186-190`:
> `// R-TXT-4: the target's name when it is unique among the instances of the reference's type, else its path.`
> `return path(t);`

and `printer.ts:173`: ``return up ? `${path(up.owner)}.${up.segment}` : `${pathKeyword(g, t.cls)}[${rootIndex.get(t.id)}]`;``

**F2 (read): the parser follows the indices in the edited text.** `parser.ts:637`: `let cur: MutableObject = tops[head.index];`
and `parser.ts:652`: `const id: unknown = f.many ? (Array.isArray(v) ? v[seg.index] : undefined) : seg.index === 0 ? v : undefined;`.
The resolved object's id is the reference's value, `parser.ts:666`: `if (message === undefined && typeof t !== 'string') return t.id;`.
Nothing in `resolve` (`parser.ts:587`) sees the previous print.

**F3 (read): the diff compares resolved targets.** `textDiff.ts:168`:
> `if ((to && keyOf(to)) === (from && keyOf(from))) return;`

A path that now resolves to another matched object produces a `reference` op (`textDiff.ts:172`). The previous print's
spans reach the matcher only (`DiffInput.previous`, `textDiff.ts:96-97`), and they are object spans: measured in the
probe, the print of the fixture carries `[{"id":"docs",...},{"id":"i0","start":28,"end":54},...]`, one span per object,
none per reference token.

**F4 (measured on `d2125a90f`): the five edits.** Fixture `ANON` (`textDiff.test.ts:670-682`): Folders `docs`
(items i0, i1, i2, sizes 10, 11, 12, no name), `pics` (empty), `watch` with `pin -> i1`, printed
`pin Folder[0].items[1]`. Every edit runs in the editor: spans carried, a cut-and-paste carries the model object's span
to the pasted object (D-5 of T7), as the Text tab does. The path text is untouched in every case (asserted,
`textDiff.test.ts:709`) and parses without error (`:710`).

| Case | Edit | Match of the moved/kept objects | Plan on `watch.pin` | Verdict | Test |
|------|------|----------------------------------|---------------------|---------|------|
| (a) | reorder: i0 cut and pasted after i1 → `[i1, i0, i2]` | i0 by span, i1 certain | `set watch.pin = Item_1` (→ i0); ordered slot: the same line plus the reorder lines | silent retarget | `textDiff.test.ts:715` |
| (b) | i0 cut from docs, pasted into pics → `[i1, i2]` | i0 by span, move op | `set docs.items -= Item_1`, `set pics.items += Item_1`, `set watch.pin = Item_2` (→ i2) | silent retarget | `:719` |
| (c) | i0 deleted → `[i1, i2]` | — | `delete Item_1`, `set watch.pin = Item_2` (→ i2) | silent retarget | `:723` |
| (d) | new Item inserted before i0 → `[new, i0, i1, i2]` | new is a create | `create … in docs.items`, `set Item_1.size = 9`, `set watch.pin = Item_2` (→ i0) | silent retarget | `:727` |
| (e) | target i1 cut, pasted into pics; i2 shifts into `[1]` | i1 by span, move op | `set docs.items -= Item_1`, `set pics.items += Item_1`, `set watch.pin = Item_2` (→ i2) | silent retarget | `:731` |
| (e2) | i1 and i2 both moved to pics → `[i0]` | — | none: parse error `items[1] names no object` (`parser.ts:655`), refusal `parse` | refused | probe only, not committed |

No case is refused or marked uncertain: `plan.refusals` is `[]` in (a)-(e) (probe output). The five tests are
`it.fails`: each asserts that the plan applies no write of `watch.pin` (a refusal also satisfies it,
`textDiff.test.ts:708-712`). Bench: turned into plain `it`, all five red on `expected true to be false` at that
assertion, none on the setup assertions; restored, 74 passed and 5 expected fail (run `bench1356`, `t1356` in
`.agent-logs/`). The (e2) row matches the handoff of P-2026-11-03-1321: "after the move the path names nothing until
retyped".

**F5 (read): the gap with the active rules.** R-TXT-22 keeps identity on a move inside the editor, and R-TXT-18 asks
that uncertain matches are "always confirmed by the user before applying". Objects keep their identity in (b) and (e),
but the reference pointing at them does not: the plan writes a different target without asking. R-TXT-32 already
makes the opposite choice for targets outside the text: "It is never re-resolved by name or position."

## Recommended rule

**An untouched reference token keeps its target.** A reference token whose text, at the same owner and feature, is
the one the previous print wrote there resolves to the object the print wrote it for, not by position (or name) in the
edited text; kept, it writes nothing. A retyped token (different text, or in the editor a token whose decoration did not
survive the edit) is resolved against the edited text as today, an ordinary retarget. If the kept target is deleted by
the same edit, the reference is cleared by the deletion, as today. After apply the re-print writes the new path.

It extends R-TXT-32's "kept verbatim it writes nothing" from outer targets to every printed reference, and turns (e2)
from a parse refusal into a kept reference. It needs a span per reference token in the print (today object spans only,
F3) or the previous print's text to compare against; the place is the reference resolution feeding
`textDiff.ts:162-183`. Outside the editor, with no previous print, the token is resolved as today, and the R-TXT-18
cascade with ids in the exported file stays the guard.

## Rejected alternatives

1. **Refuse** an untouched path whose new resolution differs from the printed target, with a marker asking to retype.
   Safe, but every insert, delete or reorder in a list with an incoming path blocks the apply, and the fix the user is
   asked for (retype the same path) is the case the rule cannot tell from untouched.
2. **Rewrite the paths in the text** as the user edits or pastes (the open question of the 1321 handoff). It edits text
   under the cursor and in the undo stack, does nothing for a re-import, and needs the same identity of the token to
   know what to rewrite to; the recommended rule gets the rewritten path from the re-print after apply.
3. **Print `@"id"` for every unnamed target**, as R-TXT-32 does for outer ones. Identity is exact, but ids fill the
   text and it contradicts R-TXT-4 for targets inside the text.
4. **Status quo** (silent retarget). Contradicts R-TXT-18 (no silent guess) and the identity R-TXT-22 gives the objects.

## Dependencies and risks

- A change would amend R-TXT-4 (and the resolution of R-TXT-11 paths): a decision row, then a code lane under
  `frontend/src/codegen/textual/` (printer spans, parser or diff); no critical-zone file.
- Not measured: a **name** reference whose target is renamed while another object takes the old name would retarget
  the same way; it was out of this measurement's scope.
- A user who wants the reference to follow the position, without retyping, is not served by the rule; retyping the
  token, or any other text, is the way to say it.

## Open questions

1. Adopt the recommended rule (an untouched reference token keeps its target) as an amendment of R-TXT-4?
2. Should it cover name references too (rename plus homonym), not only paths?
3. With the rule, is the 1321 question "should the tab rewrite such paths on a paste?" closed by the re-print after apply?
