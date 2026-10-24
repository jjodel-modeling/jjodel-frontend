# JjScript syntax highlighting in the Refactoring and script editors

Prompt-ID: P-2026-10-24-2255
Chat: C-2026-10-24-0020
Front: jjodie-ui
Lane: full (implementation, code, gates and probe)
Depends: P-2026-10-24-2215
Status: eseguito 2026-10-24 · lane jjodie-ui-hl · code 60b41aa39 · gates green · probe 19/19 · done
Corregge: none
Request: Alfonso, 2026-10-24 22:50, in the project chat («puoi mettere il syntax highlight all'editor dei refactoring?»)
Model: claude-opus-5-5

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-jjp-hl`, branch `jjp-hl`, cut from `alfonso-frontend-jjtl` at `7a1c9fdff` plus the commit that adds
this prompt. Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the `frontend/node_modules`
symlink may show). Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-10-24-2255 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list. Critical-zone files are not authorised. Time limit: 60 minutes. No subagents, no
background tasks. Commit as soon as the gates are green. One probe run per tool call. Context discipline: never `cat` a
whole large file or log; the JjScript lexer and grammar by grep-found ranges; test, build and probe output through `tail`
or `grep`. Dev server only on a free port in 3010..3019 (check with `lsof`), never 3000, 3001 or 3003; stop it at the end.
Light theme only. Subject lines without `(P-...)` suffix, Prompt-ID in the body, `Model:` trailer. Log entry in
`docs/log-inbox/jjodie-ui-hl.md`. Nothing merges anywhere: the chat merges.

## Read first, and only this

`frontend/src/jjtl/editor/jjtlLanguage.ts` (the pattern to follow: Monaco language registration with a Monarch tokenizer
and its theme rules), `frontend/src/jjscript/parser/lexer.ts` and `grammar.ts` (the token kinds and keywords: take them
from there, do not invent a keyword list), `frontend/src/components/abstract/tabs/ScriptTab.tsx:99` and
`frontend/src/components/Jodie/ScriptEditorView.tsx:199,212` (today `language="plaintext"`).

## COSA

1. A Monaco language `jjscript` (grep the id first) with a Monarch tokenizer derived from the JjScript lexer: keywords
   (`create`, `instance`, `of`, `in`, `set`, `remove`, `from`, `rename`, `delete` and whatever else the lexer defines),
   strings, numbers, comments, operators (`=`, `+=`, `.`), identifiers and dotted paths. A unit test checks that every
   keyword of the lexer is a keyword of the tokenizer, so the two cannot drift silently.
2. Token colours from the existing Jjodel editor theme (the JjTL rules, slate and cyan accents, light theme only); no new
   colour values outside the design tokens.
3. Use it in the Refactoring tab editor (`ScriptTab.tsx`), in Jjodie's script editor (`ScriptEditorView.tsx`, both
   editors, including the Compare view) and wherever else a JjScript text is shown in a Monaco editor (grep for
   `plaintext` near script code). The green edit bars and the diff view keep working.
4. Probe under `frontend/scripts/probe/`: open a Refactoring tab with a short script, read the computed colour of a
   keyword, a string and a comment token in the DOM (three different colours, keyword equal to the theme's keyword
   colour), same in Jjodie's script editor; no console errors. One crop under `~/.jjodel-lanes/P-2026-10-24-2255/`.

Gates: typecheck at the baseline of CLAUDE.md §17, vitest (summary lines), build. Commit
(`feat(jjscript): syntax highlighting in the script editors`), then the docs commit.

## HARD STOP

None: `Outcome: done` with the probe measures.

## NON FARE

No grammar or lexer change, no completion provider (later, if wanted). No critical-zone file. No merge, no push.
