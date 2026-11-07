# Discovery 2026-11-03 — textual notation: references to objects outside the text

- Prompt-ID: P-2026-11-03-1045 (`docs/prompts/` file of that ID), chat C-2026-11-03-1037
- Session: d74e6882-0fd7-4b3a-9200-134f1ca1b673
- Tree: `~/jjodel-w-textrefs`, branch `textual-refs-outside`, HEAD at start `fa9e886cb`; the expected-fail test is `167c8d0dd`
- Executor: Anthropic Claude Opus 5.5 (`claude-opus-5-5`)
- This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream rereads the real files.

## Objective

A reference whose target is not among the objects the text prints (an object of another model, or an id that names no
printed object) must print a value the parser reads back, so a model holding one can be edited from its text (R-TXT-31
(2)). Phase 1 reproduces the defect, reads the print, parse and diff paths, and recommends one syntax.

## Hypotheses under test

1. **The printer drops the value of a single-valued reference to an outer target and keeps its keyword.** Holds
   (measured, below).
2. **The resulting text does not parse, so every edit of that model is refused.** Holds (measured; pinned by the
   existing test `textDiff.test.ts:365`).
3. **The parse error is reported where the value is missing.** Falsified (measured): it lands on the next item.
4. **A many-valued reference with mixed inner and outer targets prints the inner ones and preserves the outer ones on
   apply.** Holds (read and measured).
5. **The diff can already tell an outer target from a printed one.** Partly: it filters outer ids out on the model
   side (`printable`), but has no value for an outer target on the text side.

## Files read

- `frontend/src/codegen/textual/printer.ts` (whole, 307 lines)
- `frontend/src/codegen/textual/parser.ts` lines 1-299, 350-439, 570-671
- `frontend/src/codegen/textual/textDiff.ts` (whole, 372 lines)
- `frontend/src/codegen/textual/metamodel.ts` (whole)
- `frontend/src/codegen/textual/style.ts` (whole)
- `frontend/src/codegen/textual/styleCheck.ts` lines 1-175, and the `ll1Conflicts` signature at 199-250 by grep
- `frontend/src/codegen/textual/ui/TextualTab.tsx` lines 50-209
- `frontend/src/codegen/textual/textMatch.ts`, grep of `reference` only (lines 13, 234, 243)
- `frontend/src/codegen/textual/textApply.ts`, grep of `export function` and `lookup[` only
- `frontend/src/jjscript/executor/handleRegistry.ts`, grep of its exports only
- `frontend/src/joiner/classes.ts:597-599` (id format)
- `frontend/src/codegen/textual/__tests__/textDiff.test.ts` lines 1-180, 340-390
- `docs/log-inbox/codegen.md:1298-1345`, `docs/log-inbox/hw-notation.md:61-65` (the two tickets on this defect)

## Findings

### F1. The printer skips an unresolved target and prints the keyword (measured)

`printer.ts:248`:

```
case 'xref': { const t = resolve(v); if (t) token(ref(n, t)); return; }
```

`resolve` (`printer.ts:112`) looks the id up among the printed objects only. The enclosing `opt` prints its keyword
because the raw slot is set (`printer.ts:230`, `if (!isSet(o.slots[n.feat])) return false;`). Measured on a library
fixture, plain notation, `b1.borrowedBy = 'elsewhere'`, `readers = ['m1', 'far', 'm1']` (temporary probe, deleted):

```
    Book dune {
      year 1965
      borrowedBy
      readers [ann, ann]
    }
```

### F2. The error lands on the following item (measured)

`parseText` on that text: `6:16 expected an integer; found name "ann"`. The bare `borrowedBy` reads the next keyword
`readers` as a reference name, `[` as a path segment (`parser.ts:359`, `if (!hit(peek(1), 'P:[')) { p++; return { name: t.v }; }`),
then expects the index. The marker points at the wrong line. Where the next keyword is followed by something other than
`[` and a target object happens to carry that keyword as its name, the bare keyword would even read the keyword as the
reference value; the following token then fails. Not measured, read off `parser.ts:355-371`.

### F3. The edit is refused with `parse` (measured, existing test)

`textDiff.test.ts:365`, «a single-valued target the text cannot name is an expected refusal», asserts
`codes(plan) === ['parse']`, `plan.diff === null`. The new expected-fail test `textDiff.test.ts:376` (commit
`167c8d0dd`) asserts the acceptance instead, independent of the syntax: no parse error, no refusal, lines
`['set spqr.year = 2016']` for an attribute edit elsewhere, `[]` for no edit; annotated and plain library notation.
Run: `57 passed | 1 expected fail (58)`, exit 0.

### F4. Many-valued, mixed: inner printed, outer hidden and preserved (read and measured)

Printer, `printer.ts:275`:

```
const vs = asArray(o.slots[n.feat]).filter(v => !(n.item.t === 'assign' && n.item.item.t === 'xref') || resolve(v));
```

Diff, `textDiff.ts:96-97`:

```
/** A reference slot's targets the text can name: the printed objects. The others are preserved. */
const printable = (v: unknown): string[] => asArray(v).filter((id): id is string => typeof id === 'string' && modelById.has(id));
```

So the outer target is neither printed nor touched; `textDiff.test.ts:359` pins it. A list of outer targets only prints
`[]` (`present` checks the raw slot, `printer.ts:239`), which parses. The user cannot see or remove an outer link.

### F5. The single-valued diff already preserves an outer value it cannot see (read)

`textDiff.ts:131`:

```
if (to === null && m && !isUnset(m.slots[f.name]) && from === null) return; // a target the text cannot name
```

This branch is unreachable today for a printed keyword, because the text does not parse (F3).

### F6. Parser resolution is by name or path against the whole text (read)

`parser.ts:582-595` resolves a name among the text's objects of the target types; `parser.ts:614-649` follows a path
`keyword[k].f[i]` from the text's roots. Neither has an object to resolve an outer target to; both would re-resolve to
whatever the text holds under that name or position. The tokenizer's punctuation set is fixed by the style plus
`[ ] .` (`parser.ts:68-71`); any other character is `unexpected character` (`parser.ts:143`). `@` is in no style token
(`style.ts:39-55`, the only defined style) and in no comment opener: today no text containing `@` outside a string
parses.

### F7. FIRST of a reference is `{ID, STR}` (read)

`parser.ts:223`: `case 'xref': r = { set: new Set(['ID', 'STR']), nullable: false }; break;`. The LL(1) check
(`styleCheck.ts:199-250`) runs over these FIRST sets.

### F8. Where outer ids come from in the app (read)

`TextualTab.tsx:148-149`: a reference slot is the target's id (`idOf(v)`), whatever model the target lives in; the
objects printed are the model's instances only (`TextualTab.tsx:140-152`, through `buildEvalContext(..., { extentModelId: modelId })`
at line 203). So the outer id is always known to the printer; the target's class and name are not. Ids are
`"Pointer" + time + "_" + user + "_" + n` (`classes.ts:598`): not guaranteed to be an identifier, so they must print quoted.

### F9. Matching and handles (read, partial)

`textMatch.ts:243` maps a reference target through `toModel` and treats a non-string as unmatched. `diffLines` builds a
handle per `ObjectRef` from an object of either side (`textDiff.ts:271-288`); an outer target has neither. Whether
`set h.f -= X` runs when `X`'s handle is registered against an object of another model was not read
(`handleRegistry.ts` grep only); see Q3.

## Recommendation: one syntax, `@` followed by the target's id as a string

```
Book dune {
  year 1965
  borrowedBy @"Pointer1730712345_USER_42"
  readers [ann, @"Pointer1730712345_USER_43", ann]
}
```

In a Pascal/Ada style the string takes that style's quote and escape (`@'Pointer…'`), through the printer's `quote`
(`printer.ts:172-178`). The parser reads `@` STR as an outer reference whose value is the id itself.

**Why it meets each requirement**

- *Read back by the parser*: one new punctuation token `@` in the tokenizer, one branch in `reference()`; the value is
  carried as a distinct marker (not a text id `tN`, so it cannot collide with a parsed object's id).
- *LL(1) and style checks, present and future*: FIRST(xref) becomes `{ID, STR, P:@}`. `@` starts nothing else, so any
  LL(1) conflict involving `@` already involves `ID` and is reported today; `@` adds no new conflict in any style. A new
  style-check condition rejects a style whose tokens or comment openers start with `@` (none does; the indentation style
  of T5 has no delimiters). `#` was avoided because it is the natural line comment of an indentation style.
- *Unchanged by an edit elsewhere*: the diff compares the outer id with the model's slot; equal means no op.
- *Never a silent re-resolution by name*: the value is the id, never a name or a position. An outer token is accepted
  only where the model holds that id, at the same matched owner and feature; anywhere else it is a refusal.
- *Valid if the target disappears*: the parser never resolves `@"…"` against anything, so it never fails on it. The tab
  reports a target missing from the lookup as a warning line, as R-TXT-30 does, and nothing is written.
- *Independent of model-to-model references*: it names no model and assumes no qualified naming. When that front lands,
  a target the notation can name prints by the new qualified form; `@"id"` stays the fallback for one it cannot (no
  name, a model not loaded, a deleted target). The two never collide: one starts with `@`, the other with a word.

**What the user may do with such a value in this slice**

1. Keep it verbatim: no write.
2. Delete it (the whole item, or the value of a single-valued one): clears the reference, `set h.f = null`, one undo
   step like any edit. In a list, deleting one outer target unlinks it (subject to Q3; if the run cannot address it,
   a refusal `unwritable`).
3. Retype it to a name or path of the text: an ordinary retarget (R-TXT-4 unchanged).
4. Edit the id, or paste the token at another owner or feature: refused, a new non-confirmable code
   (`outer`, «a reference outside the text can only be kept where it was printed»); the model is not touched.

**Rejected alternatives**

- *Omit the item* (print nothing, preserve on apply, as many-valued outer targets are today, F4): parses and preserves,
  but the text hides part of the model, the user cannot clear the reference, and typing the keyword silently overwrites
  a value they never saw. It is also not a syntax, which the closure criterion needs.
- *A bare or quoted name of the target*: resolved against the text it binds to a homonym or fails; a silent
  re-resolution by name.
- *A qualified path or name with the model* (`Members::Member[0]`, `Members.ann`): that is the model-to-model syntax
  this slice must not presuppose; a path is positional and re-resolves when the other model changes.
- *A keyword form* (`outside "id"`): in a reference position a word reads as a name; it needs a reserved word and two
  tokens of lookahead, and breaks an object of that name.
- *`#"id"` or a bare `@Pointer…`*: `#` is a likely comment opener in a future style; ids are not identifiers (F8).
- *The id in a comment*: comments are skipped by the tokenizer and a style may have none.

## Decisions taken (unattended)

1. The expected-fail test (`it.fails`) was committed alone as `167c8d0dd`; the old pinned-refusal test at
   `textDiff.test.ts:365` stays until Phase 2 replaces it.
2. The acceptance test asserts behaviour only (parse, refusals, lines), so it holds for whatever syntax is chosen.

## Decisions awaiting Alfonso

1. The syntax `@"<id>"` (recommended) or one of the alternatives.
2. Deleting a printed outer value clears the reference (recommended) or is refused.
3. Many-valued: print outer targets in the list too (recommended, one rule for both; amends the preservation of F4,
   `textDiff.test.ts:359` changes) or keep them hidden as today.
4. The R- row: a new **R-TXT-32**, amending **R-TXT-4** with the outer case («a target the text does not print prints
   `@` and its id as a string; it is kept, cleared or retargeted, never re-resolved»). R-TXT-4's behaviour for targets
   inside the text is unchanged; R-TXT-19's «what the notation does not show is preserved» still holds, the notation now
   shows these values.

## Risks

- Internal ids become visible and editable in the text; R-TXT-18 already allows ids in an exported text.
- `textMatch.ts:243` similarity reads reference slots: an outer marker must compare equal to the model's id there, or a
  rename candidate scores lower than it should.
- `diffLines` has no object for an outer handle (F9); a `null` clear needs none, an unlink does (Q3).
- RISC-V Briefs (hw-notation ticket, `docs/log-inbox/hw-notation.md:62`) print `library` and `operations []` today;
  after the fix they print `@"…"` values. Read-only regression check in Phase 2.

## Open questions

1. Does the eval context read a deleted target as `null` or keep the dangling id? Decides whether the «missing target»
   warning can ever fire in the app (measure in Phase 2).
2. Should the Text tab show the target's name and model on hover over `@"…"` (later, not in this slice)?
3. Does the JjScript run accept `set h.f -= X` with `X` registered against an object of another model?

Outcome of this phase: report written; hard stop for the decisions above.
