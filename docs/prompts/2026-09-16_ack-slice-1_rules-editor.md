# ACK slice 1: answers to Q1 to Q11

2026-09-16. Answers to the phase 1 report of slice 1 (`docs/discovery/discovery_2026-09-16_rules_editor_format_predicate.md`,
commit `b9ff7f36a`). Go-ahead for phase 2 with the decisions below. Where an answer changes the
prompt, the prompt is wrong and this document wins.

## What the report got right, and what it changes

Three findings are correct and I checked each one in the tree:

- **There is no drag library.** `ListEditor` states in its own comment that reordering is up/down
  buttons with no drag-and-drop dependency, and `package.json` confirms it. The prompt's "reuse the
  library already used by `LabelListEditor`" was wrong.
- **`TextStyleEditor.flip()` loses data on a rules value.** At line 85 it collapses with
  `(value as { then: T }).then`, which is `undefined` for the `rules` form, so `onChange(undefined)`
  deletes the axis. Real bug, correctly found.
- **A popover inside the typography popover would close both.** True, and it stops being a problem
  once Q1 is answered.

## Q1: which call sites get the table

**Only Fill and Marker, behind a new optional prop, opt-in.** The other call sites (12 JSX usages
across `FieldCompartmentListEditor`, `EdgeAuthoringPanel`, `BadgeListEditor`,
`VertexAuthoringPanel`, `RowAuthoringPanel`, `TextStyleEditor`, `LabelEntryEditor`) keep exactly
today's behavior, and the default value of the prop must make that true without touching those files.

This single decision also disposes of finding 2 and finding 4: no call site inside the typography
popover ever renders the table, and no site that does not opt in ever writes the `rules` form.

## Q1b: fix `TextStyleEditor.flip()` anyway

**Yes, and this is a deliberate one-function extension of the scope**, because silent deletion of an
authored setting on a click is worse than scope purity. `TextStyleEditor.tsx`, function `flip` only:
collapse through the helper you are adding, `toRules(value).rules[0]?.then ?? toRules(value).default
?? axisDefault`, instead of reading `.then` off an object that may not have it. Nothing else in that
file. A hand-authored IR can already carry a `rules` text style today, so this is a live bug, not a
hypothetical one this slice would introduce.

## Q2: reordering

**Up/down buttons, as `ListEditor` already does.** No new dependency, consistent with the six other
reorderable lists in the panel, and keyboard accessible for free. This is a deliberate deviation
from the `⋮⋮` handle drawn in the mockup: Alfonso can overrule it, and if he does, the way to get
it without a dependency is native HTML5 drag on the handle plus Alt+ArrowUp/ArrowDown. Ask before
building the drag version; do not build both.

## Q3: what None to Conditional saves

**`{ rules: [], default: '' }`**, which is your recommendation.

This bends the D2 convention a little and it is worth being explicit about why it is still right.
D2 says an absent `default` is identical to `''`, so this value renders exactly like absence: it is
not a default the user chose, it is the marker that says "Conditional mode, no rules yet", which is
artboard 2i. It has to be persisted rather than kept in component state, because the panel is
re-seeded from the store after every commit and component state would be lost on every edit. The
rule that stands unchanged is the other one: a bare `{ rules: [] }` with no `default` key is never
written, because nothing distinguishes it from absence.

## Q4: explicit Otherwise

**Yes**, set and clear, exactly like today's else toggle. Clearing it removes the `default` key, it
does not write the fallback value.

## Q5: last rule removed with no default

Your recommendation with one amendment. When the resulting value **is** the none value of the axis,
**remove the key** rather than writing `''`: D2 makes the two identical at compile and absence is
the canonical spelling. For an axis with no none value, write `defaultValue` explicitly.

## Q6: labels

The middle label is **per axis, a prop, defaulting to "Fixed"**, which is today's word. Fill passes
"Solid". Marker keeps "Fixed": "Solid marker" means nothing. Basic mode is untouched: no switch, and
a value that is already conditional still renders as the read-only chip.

## Q7: `subjectName` and the suggestion chips

**Yes to an optional `subjectName` prop**, used for the 2i copy ("every State") and for the row
prefix. Absent, the copy degrades to "every instance", which must read correctly on its own.

The suggestion chips are **out of scope for this slice**. They need a feature list filtered to
booleans, which is `PathBuilderFeatures` work and a design decision of its own. Render the empty
state without them and open a ticket.

## Q8: what `formatPredicate` prints

Not verbatim. `formatPredicate(p, opts?)` where `opts.subject?: string`:

- strip the leading `$` and a trailing `.value` from a path, so `$isFinal.value` prints `isFinal`;
- `eq <path> true` prints just the path, and `eq <path> false` prints `not <path>`. Elide only
  against a boolean literal, never against a number or a string;
- with `opts.subject` set, prefix the path with `<subject>.`, so the panel gets `state.isFinal` as
  the mockup draws it and the slice 5 caption, which passes no subject, gets `isFinal`;
- everything else prints structurally: `a == b`, `not (...)`, ` and `, ` or `, `exists p`,
  `empty p`, `isKind C`, `isKind C on p`, `marked`, `marked on p`, `always true`, `always false`;
- an unknown `op` returns the placeholder and never throws.

The text is display only: editing always goes through `PredicateBuilder`, so no round trip from
string back to AST is needed or wanted.

## Q9: where the handoff documents are

They are outside the repo, in iCloud, which is why you cannot reach them. Two of them are now being
copied into the repo so this does not repeat: `decisions-symbol-editor-1b.md` and
`02-coder-spec.md` go to `docs/handoff/`, together with `mockup-copy-1b.md`, a plain extract of
every string the mockup shows, artboard by artboard. Use those three and stop quoting the prompt for
UI copy. The `.dc.html` mockups stay out of the repo: they are 78 KB of canvas markup and the copy
extract carries everything you need from them.

## Q10: the stale help text

**Yes, fix `VertexAuthoringPanel.tsx:423`.** It says "Multiple rules are not yet editable here",
which this slice makes false. It is in a file already in scope and it is one line. Rewrite it to
describe what Basic mode does, without promising anything about Advanced.

## Q11: the shared file with slice 3

**No.** Do not commit a file conditionally on what its diff looks like: that is precisely how the
other session's half-finished work gets committed under your message.

Ownership instead: **slice 1 owns `VertexAuthoringPanel.tsx` for this round.** Slice 3 has been told
to implement everything except its panel control and to add the Corner radius field only after your
commit lands. So: implement, verify, commit, and say so, then slice 3 resumes on that file.

## Reminder on the write rules

Everything else in the prompt stands. In particular: always write the `rules` form, accept both
forms on read, one rule plus a default must compile identically to `{when, then, else}`, and the
order of `rules` is semantics because the first match wins.
