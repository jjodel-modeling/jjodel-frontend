# JjScript formatter: break before `in`

Prompt-ID: P-2026-10-24-0405
Chat: C-2026-10-24-0020
Front: jjodie-ui
Lane: full (small, language tooling, no visual change)
Depends: P-2026-10-24-0115
Status: da eseguire
Corregge: none
Request: Alfonso, 2026-10-24 00:40, in the project chat (unattended run; language note of P-2026-10-24-0020)
Model: claude-opus-5-5

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P8 does not apply (nothing visible beyond how a script prints).

Worktree: `~/jjodel-w-jjp-fmt`, branch `jjp-fmt`, cut from `jjodie-panel` at `b01d1eac1` plus the commit that adds
this prompt. Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the
`frontend/node_modules` symlink may show). Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-10-24-0405 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list. Critical-zone files are not authorised. Time limit: 50 minutes. No subagents, no
background tasks. Context discipline: never `cat` a whole large file; read the lexer and grammar by grep-found ranges.
Subject lines without `(P-...)` suffix, Prompt-ID in the body, `Model:` trailer. Log entry in
`docs/log-inbox/jjodie-ui-fmt.md`. Nothing merges anywhere: the chat merges.

## Read first, and only this

The «Language note, decided» paragraph of `docs/prompts/claude_2026-10-24_0020_prompt_jjodie_panel_jjel_live.md`.
Row R-JJD-4 in `docs/decisions.md`. The JjScript lexer and grammar under `frontend/src/jjscript/parser/`.

## COSA

1. A pure JjScript formatter (new module under `frontend/src/jjscript/`, grep the name first; reuse a formatter if one
   exists): one command per line, unchanged grammar. For a `create instance of X "n" in a.b` command whose line is
   longer than a given width (default 80), break before `in`: the first line `create instance of X "n"`, the next
   line four spaces then `in a.b`. Lines that fit stay as they are. Comments, blank lines and string contents are
   preserved byte for byte. The output parses to the same AST as the input (a test asserts this on every fixture).
2. Check that the parser accepts the continuation line (a line starting with `in` after a `create`); if it does not,
   the formatter is display only: say so in the log and expose it as `formatForDisplay`, used by nobody yet (the
   card's `Show script` and the S5 editor can adopt it later). Do not change the grammar (R-JJD-4: no nested blocks;
   a continuation rule is a grammar change and needs Alfonso).
3. Tests first, including long and short lines, names with spaces, comments, and idempotence (formatting twice gives
   the same text). Mutation bench: at least four mutants, all killed.

Gates: typecheck at the baseline of CLAUDE.md §17, vitest (summary lines), build. Commit
(`feat(jjscript): formatter that breaks long create lines before in`).

## HARD STOP

None: close with the docs commit and `Outcome: done`.

## NON FARE

No grammar or executor change, no UI wiring, no critical-zone file. No merge, no push.
