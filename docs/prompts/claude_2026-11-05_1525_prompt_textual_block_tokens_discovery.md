# Textual syntax, block tokens per element (R-TXT-51), discovery

Prompt-ID: P-2026-11-05-1525
Chat: C-2026-11-03-1037
Front: codegen
Status: eseguito (discovery, report committed; hard stop)
Lane: full (discovery, read only)
Depends: P-2026-11-05-1457 (L2a style token overrides, on textual-ebnf-literals-step2 at 2c15d1761), R-TXT-51
Worktree: ~/jjodel-w-blocktok, branch textual-block-tokens, from 2c15d1761 (L2a tip; own node_modules)
Request: https://claude.ai/code/session_01DQt9R5nh3m4Y234MPGL9kH (Alfonso 2026-11-05 09:22, recorded as R-TXT-51, ratified 09:26)

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit on top of 2c15d1761 and the tree is clean, otherwise stop with Outcome: blocked. Read only: no source file changes; you write the discovery report and throwaway probes in the lane folder. Every reply opens with [P-2026-11-05-1525 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs LABEL -- CMD. Write the report section by section, committing after each (RC-51).

## COSA

R-TXT-51, on top of L2a's language-wide token overrides. Target text:

```
begin program
   declaration is
      ...
   end
end program
```

(1) **Per-block tokens**: where a class annotation and a containment feature annotation would carry optional block open and close tokens (annotations.ts types and resolution), a close of several tokens (`end program`), the empty block derived from them; how concreteGrammar.ts builds a block today (the `block(...)` node and the style tokens through `tokens(param, ts)`), and what a per-node token needs (a `src` for the EBNF origin of L1a, distinct from the style's). (2) **Reserved names and tokens**: per-block word tokens join the reserved names (styleCheck `reservedWords`, parser `reserved`, the printer's quoting); per-block punctuation joins the tokenizer's puncts and the `taken` check; `checkStyle` (LL(1) with FIRST/FOLLOW, block-delimiters, terminator rules) and the parser's recovery (parser.ts:906 and the sync points) read the node's own tokens, not only the style's; the line-aware LL(1) of R-TXT-50 under Indentation (per-block tokens ignored there with a notice, R-TXT-51 (4)). (3) **The head prefix** (`begin program` before the class keyword), a separate slice: where in the head it sits, how LL(1) sees a prefix shared among alternatives (refused as a conflict), the printer and the parser. (4) **Interplay** with R-TXT-51 (4): overrides survive a base switch among free-layout styles; an EBNF edit of a per-block token changes that block only (the L1a/L1b origin and setLiteral); the Syntax form fields in Advanced. A probe on a small metamodel of the lane's own (program, declarations, statements) that derives the target text with a hand-made record, to show what fails today. (5) **Lane plan** (files per lane, order, visual or not; the head-prefix slice separate) and decisions D1..Dn with recommendations.

Discovery report, mandatory: docs/discovery/discovery_2026-11-05_textual_block_tokens.md (objective, files read with full paths, findings, risks, open questions), committed on the branch, plus the Status flip of this prompt left uncommitted (RC-17). Hard stop after the report. No push, no merge. Public repo: name no partner company. Final message: findings in short, D1..Dn with recommendations, then the Outcome.

## DOVE

Read: frontend/src/codegen/textual/ (annotations.ts, concreteGrammar.ts, styleCheck.ts, parser.ts, printer.ts, style.ts, syntaxRecord.ts, syntaxForm.ts, ui/TextualTab.tsx, ui/SyntaxForm.tsx). Write: the report and the lane folder.

## RIFERIMENTI

docs/decisions.md R-TXT-16, R-TXT-27, R-TXT-41, R-TXT-48..51; docs/discovery/discovery_2026-11-05_textual_ebnf_literals.md §4.
