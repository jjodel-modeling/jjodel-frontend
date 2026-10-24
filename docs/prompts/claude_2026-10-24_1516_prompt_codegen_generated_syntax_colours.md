# Code generation 3.3: syntax colouring of the generated text

Prompt-ID: P-2026-10-24-1516
Chat: C-2026-10-23-2009
Front: codegen
Lane: full (codegen UI only)
Depends: P-2026-10-24-1515
Status: da eseguire
Corregge: none
Request: Alfonso, 2026-10-24 15:08, in the project chat, after his visual check of `cg-generators` (kept locally as `request.md`)

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is done (Alfonso's visual check is the finding). P8 replaced: the chat runs the visual check on the crops
(RC-23).

Worktree: `~/jjodel-w-cggen`, branch `cg-generators`. Before anything else: `pwd`, branch, `git log -1`,
`git status --short` (only the `frontend/node_modules` symlink may show). Otherwise stop. Leave port 3131 alone.

Model and tier: as `lane-run` assigns.

## Lane discipline

Every reply opens with `[P-2026-10-24-1516 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list. Time limit: 75 minutes. No subagents, no background tasks. Commit as soon as
the gates are green. One probe run per tool call. Never print a diff, a whole file or a whole log. Dev server:
`npm start -- --port 3133 --strictPort`, stopped before the close.

## Alfonso's finding (2026-10-24, visual check)

«It would be good to have syntax highlighting for the generated code.» The generated text is a `<pre>` with gutter
built by `ui/codeLines.ts` (`linesOf(code, map)`), whose spans carry the provenance (hover, click, Alt+click); it
has no colouring.

## COSA

1. **Tokens from Monaco, not a new library.** Monaco is already in the codegen chunk (the Template Editor). Use its
   tokenizer (`monaco.editor.tokenize(text, languageId)`) on the generated text of the shown file; the language
   comes from the file's extension: `.js`/`.mjs` → `javascript`, `.ts` → `typescript`, `.v`/`.sv` → the Verilog or
   SystemVerilog id Monaco registers (measure which exists), `.json`, `.md`, `.html`, `.py` and `.java` if
   registered, else plain text with no colouring.
2. **Merge, do not replace.** Each line's pieces from `linesOf` are split further at token boundaries, so every
   piece keeps its provenance entry (hover, click, Alt+click and the hover highlight unchanged) and gains a token
   class. Pure function in `ui/codeTokens.ts` (`colourLines(lines, tokens)`), unit-tested without Monaco.
3. **Classes and colours.** A small fixed set (`keyword`, `string`, `number`, `comment`, `type`, `delimiter`,
   `identifier`), mapped from the token type prefix, coloured in `TemplateEditorTab.scss` with the editor's light
   theme colours read from the Monaco theme in use (no hard-coded palette that drifts from the template editor);
   the provenance hover/selection background stays readable over every colour.
4. **Cost.** Tokenize only the shown file, memoized on its text; no work in Run output or Check values. A text over
   the 1,000,000-character budget (S7) is shown uncoloured.
5. Tests (kills named): a piece split at a token boundary keeps its provenance entry on both halves (kills: entry
   dropped on the second half); an unknown extension yields no classes (kills: javascript assumed); the turnstile
   default output has `keyword` pieces on `const` and `function` (kills: map empty).
6. Probe and crops: extend `scripts/probe/codegen-generator-tab.ts` to assert coloured spans in Preview and that a
   fragment click still selects on the canvas. Crops under `~/.jjodel-lanes/P-2026-10-24-1516/crops/`: Preview of
   the turnstile default coloured; the same with a fragment hovered.

## DOVE

New `frontend/src/codegen/ui/codeTokens.ts` and its test; `ui/codeLines.ts` (only if a field must be added),
`ui/GeneratorPane.tsx` (the code view), `ui/TemplateEditorTab.scss`, `frontend/scripts/probe/codegen-generator-tab.ts`,
`docs/log-inbox/codegen.md`, this prompt's `Status:` line.

## Gates

From `frontend/`: `npm run typecheck` exit 0; `npm run build`; `npx vitest run src/codegen`;
`npm run check:codegen-lazy -- --on` (Monaco must stay out of the eager closure); the probe green; bench
killed/total.

## Close

`feat(codegen): syntax colouring of the generated text (P-2026-10-24-1516)`, then the docs commit with the log entry
and the `Status:` flip `eseguito 2026-10-24 · lane codegen · <feat sha> · <bench k/n> · crops in the lane folder`.
`Outcome: done`.

## NON FARE

No new dependency. No change to the template editor's own colouring. Nothing in the critical zone. No push, no merge
(R-GEN-39).
