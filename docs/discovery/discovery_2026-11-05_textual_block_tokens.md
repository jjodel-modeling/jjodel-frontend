# Discovery: block tokens per element (R-TXT-51)

Prompt: P-2026-11-05-1525 (`docs/prompts/claude_2026-11-05_1525_prompt_textual_block_tokens_discovery.md`), chat
C-2026-11-03-1037, front codegen. Branch `textual-block-tokens` at `09748cf30` (the prompt's commit on `2c15d1761`, the
L2a tip). Read only: no source file changed. Probes in the lane folder `~/.jjodel-lanes/P-2026-11-05-1525/`
(`probe_block_tokens.ts` and its output `probe_block_tokens.out.txt`; `probe_form_field.ts` and `probe_form_field.out.txt`),
bundled with the worktree's esbuild and run with node, not committed.

## 0. Objective and hypotheses

R-TXT-51 asks for block tokens per element on top of the language-wide tokens of L2a (R-TXT-48 (2)), to reach

```
begin program
   declaration is
      ...
   end
end program
```

Hypotheses this discovery tries to falsify:

- **H1.** The printer and the parser already read a block's tokens off its grammar node, not off the style, so a
  per-node token needs no change in either, except the tokenizer's punctuation and the reserved names.
- **H2.** The checks that guard block tokens (`block-delimiters`, `reserved-words`, `style-tokens`, the `taken` check of
  a punctuation keyword) read only the style, so a per-block token passes them unchecked.
- **H3.** The EBNF gives every block token the origin `style.blockOpen`/`style.blockClose` by index, so an EBNF edit of a
  per-block token today would change the language-wide token.
- **H4.** The target text needs no head prefix: a positional, nameless `Program` whose block opens with `begin program`
  derives it; the prefix is needed only for a named class (`begin program P`).
- **H5.** A prefix shared by two classes at one position is already refused by the LL(1) check, as R-TXT-51 (3) wants.

## Files read (full paths)

- `/Users/alfonso/jjodel-w-blocktok/frontend/src/codegen/textual/style.ts` (whole)
- `/Users/alfonso/jjodel-w-blocktok/frontend/src/codegen/textual/annotations.ts` (whole)
- `/Users/alfonso/jjodel-w-blocktok/frontend/src/codegen/textual/concreteGrammar.ts` (whole)
- `/Users/alfonso/jjodel-w-blocktok/frontend/src/codegen/textual/styleCheck.ts` (whole)
- `/Users/alfonso/jjodel-w-blocktok/frontend/src/codegen/textual/parser.ts` (:224-283, :505-524, :574-577, :581-780,
  :895-1194, and greps over the whole file)
- `/Users/alfonso/jjodel-w-blocktok/frontend/src/codegen/textual/printer.ts` (:84-100, :284-323, :545-576, greps)
- `/Users/alfonso/jjodel-w-blocktok/frontend/src/codegen/textual/syntaxRecord.ts` (:40-105, :195-243)
- `/Users/alfonso/jjodel-w-blocktok/frontend/src/codegen/textual/syntaxForm.ts` (:31-122, :237-341, :420-481,
  :640-750, greps)
- `/Users/alfonso/jjodel-w-blocktok/frontend/src/codegen/textual/ui/SyntaxForm.tsx` (:296-353, greps)
- `/Users/alfonso/jjodel-w-blocktok/frontend/src/codegen/textual/ui/TextualTab.tsx` (greps only: the picker, :931, :935, :1467)
- `/Users/alfonso/jjodel-w-blocktok/frontend/src/codegen/textual/metamodel.ts` (:1-60)
- `/Users/alfonso/jjodel-w-blocktok/frontend/src/codegen/textual/__tests__/styleTokens.test.ts` (:1-70, greps),
  `__tests__/spec.ts` (:1-96)
- `/Users/alfonso/jjodel-w-blocktok/docs/discovery/discovery_2026-11-05_textual_ebnf_literals.md` (§4, :286-404)
- `/Users/alfonso/jjodel-w-blocktok/docs/decisions.md` (R-TXT-51, through the lane's injected rows)
- `/Users/alfonso/jjodel-w-blocktok/docs/PROTOCOL.md` (P4)

Not read: `languageService.ts`, `textDiff.ts`, `textMatch.ts`, `modelLines.ts`, `textApply.ts` (outside the prompt's
list); a grep for `items[0]` over the textual sources found no reader of the class keyword by position in them.
