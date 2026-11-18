# Discovery: how the textual parser holds up on incomplete text (step A, phase 1)

- Prompt-ID: P-2026-11-03-1415 (`docs/prompts/claude_2026-11-03_1415_prompt_textual_a_discovery.md`), chat C-2026-11-03-1037, front codegen
- Session: 594b2a35-6968-4386-a3a4-8ef7ddc5ebf0
- Tree: `~/jjodel-w-texta`, branch `textual-a-tolerant-parser`, HEAD `6fb7d2841` (contains the textual-t7 merge `ec570ca11`)
- Executor model: Opus 5.5 (`claude-opus-5-5`)
- This report is a set of hypotheses with evidence, not a reference. Whoever uses it re-reads the real files.

## Objective

Measure how `frontend/src/codegen/textual/parser.ts` behaves on incomplete text, on non-hardware metamodels in every
annotated form the tests already use; then read how spans, identity (R-TXT-22) and comments relate to a concrete
syntax tree; recommend one design for step A (tolerant parser with positions, together with T9) and say what the
language service of steps B and D needs from it (R-TXT-34). No production code.

## Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | The parser never throws and always ends on a broken text | **holds** (measured: 0 throws over 1,214 mutants) |
| H2 | A parse stops at the first error | **falsified in general, holds in one shape**: it stops only when the fault breaks the opener of a block (the root's keyword or `{`), and then everything inside is lost |
| H3 | The objects outside the fault survive with their spans | **partly**: 84-98% after a single-token deletion; 100% of the complete objects before a cut, but only 4-59% of them unmarked |
| H4 | The error is reported at the real fault | **holds for the nearest error, not for the first one**: the nearest error sits on the fault in 81-100% of broken mutants, but the first error of the sorted list lies before the fault in 8-79%, a reference error caused by the fault |
| H5 | Parse time is fine for a per-pause parse on large texts | **partly**: 5-6 ms at 1,200 objects, 78-104 ms at 6,000, 1.1 s at 24,000; the growth is quadratic and comes from reference resolution |
| H6 | The parse result is, or can be read as, a concrete syntax tree | **falsified**: one span per object and one per reference token; no token, keyword, name, value, block or comment is kept |

## Files read

- `frontend/src/codegen/textual/parser.ts` (whole, 729 lines)
- `frontend/src/codegen/textual/printer.ts` (lines 15-40, and a bounded grep for scans inside loops)
- `frontend/src/codegen/textual/style.ts` (whole)
- `frontend/src/codegen/textual/textMatch.ts` (lines 1-40)
- `frontend/src/codegen/textual/textDiff.ts` (lines 550-565)
- `frontend/src/codegen/textual/syntaxRecord.ts` (lines 186-201)
- `frontend/src/codegen/textual/annotations.ts` (interfaces, lines 15-77)
- `frontend/src/codegen/textual/ui/TextualTab.tsx` (lines 225-314, 600-699, 795-819)
- `frontend/src/codegen/textual/__tests__/corpus.ts`, `parser.test.ts` (whole); `textDiff.test.ts` (1-205); `annotations.test.ts` (1-60 and the annotation records by grep); `syntaxRecord.test.ts` (125-140); `textualEdit.test.ts` (50-72)
- `docs/sessioni/sessione_2026-11-03_textual_ide_plan.md`; `docs/discovery/discovery_2026-11-01_textual_viewpoint.md` §A.4-A.7 (lines 667-815); R-TXT-18, -20, -21, -22, -24, -26, -34 as injected

## Method (measured)

Probe: `docs/discovery/harness/probe_2026-11-03_textual_tolerant_parser.test.ts`, run as a vitest file on HEAD
`6fb7d2841` (log `.agent-logs/probe-20261103-*.log`, figures `.agent-logs/tolerant_probe.json`, both gitignored).
For each case the valid print is tokenised (a copy of the C-like token rules of `parser.ts:93-175`), then:

- **truncation**: the prefix ending after every token (one mutant per token);
- **deletion**: the text with one token removed (one mutant per token).

The fault is the cut point or the deleted token's offset. An original object is *outside* the fault when its span
ends before it or starts after it; it *survives* when the mutant's parse has an object of the same class with the
same span (shifted by the deletion); it is *intact* when it also is not in `recovered`. *Stopped* means: the original
had objects after the fault and none of them survived. Distance is counted in tokens of the mutant from the fault to
an error's start.

Cases (none hardware; the forms are the annotations the tests use, moved onto the library where the tests only use
them on Core/Arbiter):

| Case | Annotated forms | Tokens | Objects |
|---|---|---|---|
| library, plain | none | 65 | 10 |
| library, annotated | renamed feature keyword (`patrons`), positional attribute (`genre` keyword `''`), `groupBy` with enum subsets | 68 | 10 |
| library, lines | renamed class keyword (`shelf`), `layout: 'line'`, name keyword (`titled`), renamed reference keyword (`by`), positional attribute | 50 | 10 |
| turnstile, plain | none (codegen/examples/turnstile) | 73 | 10 |
| turnstile, annotated | `inline` containment, renamed keyword (`to`), positional reference (`event`) | 63 | 10 |
| garage, c-like / lower | lower-case class and literal style; homonyms, paths, nested containments | 149 | 13 |

All five annotated notations derive with no issue (`issues: []` for each). Not covered: the name pattern
(`name.default`) and `value: 'name'`, both used only on the Core/Arbiter fixture with its mandatory features.

## Findings

### F1. Never throws, always ends (measured)

0 throws in 1,214 mutants. Every mutant parsed in at most 0.34 ms. Consistent with `parser.test.ts:194` («never
throws and always ends, on every prefix of a printed text») and with the loop guard at `parser.ts:497-498`:
«// Every turn reads a token or ends the body; a turn that did neither skips one, so the loop always ends.»

### F2. Single-token deletion: what survives (measured)

| Case | broken / mutants | objects outside kept (span) | intact | objects after the fault kept | stopped | lost some after |
|---|---|---|---|---|---|---|
| library, plain | 56/65 | 90.2% | 78.5% | 83.4% | 5/52 | 14/52 |
| library, annotated | 59/68 | 83.8% | 71.2% | 72.4% | 9/55 | 20/55 |
| library, lines | 43/50 | 90.5% | 80.7% | 84.0% | 4/39 | 13/39 |
| turnstile, plain | 71/73 | 97.2% | 92.4% | 95.9% | 1/68 | 11/68 |
| turnstile, annotated | 57/63 | 97.7% | 93.5% | 96.6% | 1/54 | 9/54 |
| garage, c-like | 142/149 | 96.0% | 90.5% | 91.8% | 0/137 | 25/137 |
| garage, lower | 142/149 | 96.0% | 90.7% | 91.9% | 0/137 | 25/137 |

Attribute values of every surviving object are equal to the original's (the "attrs kept" share equals the span share
in every row).

Errors per broken mutant: one in 54-81%, two in 2-39%, three or more in 7-24% (max 11, garage).

**Where it stops.** Every "stopped" mutant deletes a block opener: the root's class keyword (`Library`, `shelf`), the
root's `{`, a group's `{` (`prose {`), the `members` keyword, or a `{}` whose loss shifts the next object. Deleting
`Library` from `Library city {` reports one error («expected "Library", "Book" or "Member"; found name "city"») and
loses all 9 contained objects. The cause is `sync` (`parser.ts:449-464`), which skips balanced blocks at any depth
before it looks for a resume point:

```
if (depth === 0) {
    if (closing && frame.close) return;
    if (t.line > errLine && (frame.can(t) || (t.first && frames.some(f => f !== frame && f.can(t))))) return;
}
if ([...opens].some(m => hit(t, m))) depth++;
```

So after an error at the opener of a block, the whole block is the "rest of the item" and is skipped, even though its
lines (`Book book0 {`) start items the parser could read. In a single-root text, the common shape of a Jjodel model,
one deleted `{` empties the outline.

**Accepted deletions** (no error): an object's name (`city`, `book0`, `w`, `b`), a string in a list, a positional
literal (`FICTION`, `coin`, `push`). Names are optional in the grammar; mandatory features are not enforced by it
(`genre` is `lower: 1` in `LIBRARY_IDS` and its deletion parses). That is conformance, the business of the validation
markers of step D, not of the parser.

### F3. Truncation: what survives (measured)

| Case | objects complete before the cut kept (span) | of them intact | errors per broken prefix: 1 / 2 / ≥3 | max |
|---|---|---|---|---|
| library, plain | 100% | 4.4% | 4 / 5 / 55 | 6 |
| library, annotated | 100% | 4.1% | 4 / 4 / 59 | 7 |
| library, lines | 100% | 5.7% | 4 / 10 / 35 | 5 |
| turnstile, plain | 100% | 40.6% | 4 / 4 / 64 | 8 |
| turnstile, annotated | 100% | 43.6% | 4 / 7 / 51 | 7 |
| garage (both) | 100% | 59.0% | 23 / 56 / 69 | 5 |

Everything complete before the cut is read, with its span and values (100% in every case). But almost none of it is
*intact*: a block left open marks every object read inside it as recovered (`parser.ts:521-525`):

```
record(errorAt(t, `expected "${n.close.join(' ')}" to close the "${n.open.join(' ')}" at ${opener.line}:${opener.col}; found ${describeToken(t)}`));
recovered.add(o.id);
for (const x of objects.slice(since)) recovered.add(x.id);
```

So `recovered` cannot tell an outline "this object is partial" from "this object is complete but its container is not
closed". A cut also yields one error per open block, all at the end of the text: a cascade of 3-8 errors for one fault.

### F4. Error position (measured)

Distance in tokens from the fault, broken mutants only:

| Case, kind | nearest error at or after the fault: 0 / 1 / 2-5 / >5 / before | first error of the list before the fault |
|---|---|---|
| library, plain, delete | 53 / 2 / 0 / 0 / 1 | 8 of 56 |
| library, annotated, delete | 53 / 4 / 1 / 0 / 1 | 10 of 59 |
| library, lines, delete | 35 / 8 / 0 / 0 / 0 | 4 of 43 |
| turnstile, plain, delete | 64 / 2 / 2 / 0 / 3 | 15 of 71 |
| turnstile, annotated, delete | 52 / 2 / 0 / 0 / 3 | 15 of 57 |
| garage, delete | 133 / 5 / 0 / 3 / 1 | 11 of 142 |
| truncation, all cases | 0 tokens in 92-100% (at the end of the text) | 27 to 56 of 49-148 |

The syntax error itself is on the fault or one token after it in 93-100% of broken mutants. What lies before the
fault is always a **reference error caused by the fault**: «no object of type Member is named "reader1"», «there is
no top-level State[0]: the text has 0», reported at a referrer whose target was cut off, skipped by F2's `sync`, or
lost its name. Since `errors.sort((a, b) => a.start - b.start)` (`parser.ts:615`), these come first in the list and,
in the editor, as markers above the real fault. The three garage cases at more than 20 tokens are deletions of a
referenced name (`alpha`, `inner`, `v`): the text is syntactically valid and the reference error at the referrer is
the right report.

### F5. Time on a large text (measured, median of 5)

Library, plain; books : members = 5 : 1, a third of the books with a `borrowedBy` reference.

| Objects | Characters | valid | one token deleted mid-text | cut at half | without references, valid | print |
|---|---|---|---|---|---|---|
| 1,201 | 66 k | 6.3 ms | 5.9 ms | 1.7 ms | | 5.8 ms |
| 6,001 | 336 k | 102 ms | 104 ms | 25 ms (903 errors) | 13.3 ms | 118 ms |
| 24,001 | 1.37 M | 1,155 ms | 1,141 ms | 224 ms (3,623 errors) | 48 ms | 1,894 ms (542 ms without references) |

The annotated and line forms show the same growth (all rows in the probe's JSON). Without references the parse is linear (13 ms to 48 ms
for 4× the objects); with them, 6k to 24k costs 11×. The quadratic term is the name lookup, one scan of all objects
per reference (`parser.ts:630`): `const found = objects.filter(x => targets.includes(x.cls) && nameOf(x) === s.name);`.
The cut at half shows the other cost of F4: 903 reference errors for one fault. The printer is superlinear too, with
and without references; two candidates are visible (not isolated by measurement): the same uniqueness scan per
reference (`printer.ts:205`) and `all.filter(v => !grouped.includes(v))` over a containment's values (`printer.ts:159`).

### F6. What the result holds, against a concrete syntax tree (read, one probe)

- **Comments and layout are dropped by the tokenizer.** `parser.ts:126-132`: «if (ch === '\n') { skipTo(i + 1); continue; }» ... «if (lineComment && text.startsWith(lineComment, i)) { ... skipTo(e < 0 ? text.length : e); continue; }». A `Token` (`parser.ts:81-91`) has kind, value, line, col, start, end and `first`, no trivia. Measured: a text with a header comment, a trailing comment and a comment before a close parses with 0 errors, the result's keys are `objects, errors, recovered, spans, refs`, and none of the comments' text occurs in the serialised result. Absence search: `grep -c -i "trivia\|hidden"` gives 0 in `parser.ts` and in `printer.ts`; control, `grep -c "spans" parser.ts` gives 3.
- **Spans are per object only**, from the keyword to the last token read: `starts.set(o.id, peek().start)` (`parser.ts:365`), `ends.set(o.id, Math.max(lastEnd(), starts.get(o.id) ?? 0))` in a `finally` (`parser.ts:381`), so a recovered object has a partial span. Reference tokens have their own span (`ParsedRef`, `parser.ts:53-65`). No span exists for a class keyword, a name, a feature keyword, a value, a feature item, a block's open and close, or a list. The printer keeps the same two granularities (`printer.ts:246` objects, `printer.ts:276` references).
- **Ids are positional**: `{ id: \`t${++counter}\`, cls: rule.cls, slots: {} }` (`parser.ts:363`). Identity across parses comes only from the match of `textMatch.ts` (R-TXT-22, header lines 5-15), and that match never runs on a broken text: `planTextEdit` returns `diff: null` when `!isApplicableParse(input.parsed)` (`textDiff.ts:556-558`). In the tab, a broken parse keeps the spans Monaco carried: «// Spans are re-derived from every parse that matched (R-TXT-22); a broken one keeps the carried ones.» (`TextualTab.tsx:811-812`). So today an outline of a broken text cannot say which model object a recovered item is.
- **The grammar node that read a token is not recorded**, so hover (metaclass, multiplicity) and completion (what may come here) have nothing to look up at an offset. The expected set exists only inside error messages (`parser.ts:318-320`, `527-528`), and §A.4 already noted it drops the FIRST sets of skipped optionals (`discovery_2026-11-01_textual_viewpoint.md:706-709`).

## Risks

1. Single-root models lose their whole outline on one deleted `{` or class keyword (F2). This is the shape that step B's outline is judged on.
2. A reference error placed before the syntax error reads as the cause (F4); in a cut text there are hundreds (903 at 6k objects).
3. `recovered` conflates partial and unclosed-container objects (F3); an outline that greys recovered items greys almost everything during typing.
4. Per-keystroke features (semantic tokens) on 6k objects cost 100 ms today, 13 ms once resolution is linear (F5).
5. A CST that only the parser builds leaves T10 (reprint only changed spans, keep comments) without the printer's half: the printer must emit the same tree, or the two drift.
6. R-TXT-21 (8) must keep holding: any new recovery (insertion, descent into skipped blocks) produces more, and more plausible, recovered objects. They still must never reach `planTextEdit`'s diff.

## Recommended design (one choice)

**A lossless concrete syntax tree built by both parser and printer, with trivia on tokens, and an improved recovery
that never skips a block it can read.**

1. **Tokens keep trivia.** The tokenizer emits whitespace and comments as trivia attached to tokens: trailing trivia
   is what follows a token up to and including the end of its line; leading trivia is everything else before a
   token. The `EOF` token carries the final trivia. The text is the concatenation of the tokens with their trivia,
   byte for byte (a lossless round trip, testable on every mutant of the probe's corpus).
2. **Nodes mirror the concrete grammar.** One node per object (with its rule and class), per feature item (with its
   feature), per block, per list, per reference; leaves are tokens tagged with their role (class keyword, feature
   keyword, name, value, literal, reference, punctuation). Spans, `ParsedRef` and the object list are derived from the
   tree, so the existing API (`TextParseResult`) stays as it is and gains a `tree` field (an optional property, Rule 11).
3. **Comment association** is derived, not stored (§A.6): an own-line comment is leading trivia of the next token and
   belongs to the innermost node that token starts; a same-line comment is trailing trivia of the previous token and
   belongs to that token's item; a comment before a close is leading trivia of the close token and belongs to the
   block. T10 reprints a changed object's node and keeps the trivia of its first and last tokens.
4. **Error nodes.** Skipped tokens go into an error node at the place they were skipped, so the tree still covers the
   whole text and the outline knows where the damage is.
5. **Recovery, in order of cost**: (a) single-token deletion and insertion at `expect` (the current token is extra
   when the next one is expected; the expected token is missing when the current one can follow it), which repairs
   every "stopped" case of F2 that deletes a `{` or a feature keyword; (b) in `sync`, a block met while skipping is
   read as a body instead of being jumped over, so `Book book0 {` lines inside a broken root still become objects;
   (c) a missing class keyword at the start of an object is inferred when exactly one class's body admits what
   follows (`Library` from `city { books {`), reported as the error it is. An object closed only by the end of the
   text, or by a line of an enclosing body, is *unclosed*, not *partial*: `recovered` keeps meaning "not applicable",
   and a new optional field says which of the two it is.
6. **Diagnostics in two tiers**: syntax errors, and link errors. When a text has a syntax error, a link error whose
   target could lie in a skipped or cut region is reported as secondary (a warning with «may follow from the error at
   L:C»), and the markers are ordered with the syntax errors first.
7. **Linear resolution**: a name index per class built once per parse replaces the scan at `parser.ts:630`; the same
   for the printer's `printer.ts:205`.
8. **The printer builds the same tree.** A printed text and its parse give equal trees (a test over the corpus), so T10
   can splice nodes.

### Rejected alternatives

- **Spans only, plus a side table of comments by offset**: the comments are not anchored to items, so a reprint of a
  changed object cannot keep them; T9/R-TXT-20 unmet.
- **Xtext's hidden-token leaves in the tree** instead of trivia on tokens: equivalent in power, but every node walk
  must skip them and the leading/trailing split has to be recomputed on each use; trivia on tokens gives §A.6's rules
  as a property of the token.
- **Incremental parsing** (tree-sitter, ohm's incremental match): not needed at the measured sizes once resolution is
  linear (48 ms at 24k objects); tree-sitter is a new dependency (Rule 4) and a generated grammar per metamodel.
- **Error-correcting general parsing** (nearley, Burke-Fisher minimal repair): nearley has no recovery (§A.4 table);
  minimal-cost repair is out of proportion with what F2 shows, which (a) and (b) above cover.
- **Monaco decorations as the identity of tree nodes**: rejected by R-TXT-22.

## What the language service of steps B and D needs from it

| Service | Needs from the tree |
|---|---|
| Semantic highlighting (B) | every leaf with its role; references marked resolved or unresolved |
| Outline, breadcrumb (B) | object nodes with full range and name range, nesting, recovered/unclosed flags; the node path at an offset |
| Folding (B) | block and list nodes with their open and close tokens |
| Go to definition, find references (B) | reference leaf to target object node; the inverse index from an object to its reference leaves |
| Hover (B) | leaf to grammar node to class or feature (metaclass, multiplicity, documentation) |
| Outline of a broken text linked to the model (B, E) | R-TXT-22's match run on a broken parse for display only, never for the diff (R-TXT-21 (8)) |
| Completion (D) | the parser's expected set at an offset, including skipped optionals; the target type of a reference slot; the enum of a literal slot |
| Line errors with quick fixes (D) | errors with a code and a range (missing close, unknown keyword with the allowed ones, twice, out of order, unresolved name with candidates) |
| Safe rename (D) | an object's name leaf and all reference leaves to it, paths included |
| Formatting (D) | the printer over the tree, keeping trivia |

## Decisions taken (unattended)

1. The non-hardware corpus is library (three forms), turnstile (two forms) and garage (two styles); the annotated
   forms the tests use only on Core/Arbiter (class keyword, line layout, name keyword) are moved onto the library.
   Name patterns and `value: 'name'` are left out. Provisional, reversible: the probe is committed.
2. Survival is span-exact by class; a span shifted by a deletion counts as kept. Provisional.
3. The probe is committed in `docs/discovery/harness/` as evidence; its working copy in `__tests__` was deleted.

## Decisions awaiting Alfonso

1. The design above: a lossless CST with trivia on tokens, built by parser and printer alike.
2. Recovery (a) insertion/deletion, (b) descent into skipped blocks, (c) inferred class keyword: all three in A, or (c) later.
3. A new optional "unclosed" flag next to `recovered`, so the outline greys only partial objects.
4. Link errors after a syntax error become secondary warnings and follow the syntax errors in the list.
5. R-TXT-22's match also runs on a broken parse, for the outline and synced selection only, never for the diff.
6. Linear name resolution in the parser and in the printer, inside A.
7. The printer's half of the tree (needed by T10): in A, or at the start of T10.

## Open questions

1. Do any Jjodel models in use have tens of thousands of objects in one text, so that per-keystroke parsing must be budgeted below 50 ms at that size?
2. Should the outline show objects recovered from a broken root under an "unknown container" node or as top-level items?
