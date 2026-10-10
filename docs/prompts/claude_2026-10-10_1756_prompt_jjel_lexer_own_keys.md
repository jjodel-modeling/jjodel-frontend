# JjEL lexer: own-key lookups for OCL method messages and keywords

Prompt-ID: P-2026-10-10-1756
Chat: C-2026-10-10-1512
Request: https://claude.ai/code/session_015Px4yAHrpWDZQo31DjapvA
Lane: fast (two lookups in one lexer file, with tests; outside the critical zone; tier drawn (RC-45): light)
Depends: none
Status: da eseguire

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-jjellexer`, branch `jjel-lexer-own-keys`, cut from the trunk tip that carries the docs commit
adding this prompt, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` and a
clean `git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-10-1756 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.
Unattended: Alfonso is away; a question with one recommendation inside this lane's perimeter is answered as
recommended (RC-21).
This lane's tier was drawn at random under RC-45 (light). Do not ask for another model and do not hand work back
because of the model; if something is beyond reach, stop with `Outcome: blocked` and say what is missing.

## Context (filed 2026-10-04, re-checked by the chat 2026-10-10 17:52 on trunk c43001de4)
The JjEL lexer looks up identifiers in plain objects with `in` and with bracket access, so names inherited from
`Object.prototype` match:
- `frontend/src/jjel/lexer/lexer.ts:551`: `if (text in OCL_METHOD_MESSAGES)` is true for `toString`, `valueOf`,
  `hasOwnProperty`, `constructor`…, so `x.toString()` fails with a parse error whose message is the source of the
  native function («function toString() { [native code] }»).
- `frontend/src/jjel/lexer/lexer.ts:567`: `JJEL_KEYWORDS[textLower]` returns a function for `constructor` (and the
  other prototype names), so an attribute called `constructor` does not lex as an identifier.
Display code works around it today by writing `'' + n` instead of `n.toString()`. Leave those workarounds alone.

## WHAT
DOVE: `frontend/src/jjel/lexer/lexer.ts`, one new or extended test file under `frontend/src/jjel/**/__tests__/`, and
the lane's entry in `docs/log-inbox/`. Ask first for any other file.

1. Make both lookups own-key only (`Object.hasOwn`, or a `Map` built once at module load; pick one, say why). No other
   change in the lexer. Do not rename `OCL_METHOD_MESSAGES` or `JJEL_KEYWORDS`.
2. Tests, written first and seen red on the current code: `x.toString()`, `x.valueOf()` and `x.hasOwnProperty()` no
   longer produce the native-source message (assert the token stream or the parse result, whichever the existing
   tests use); `constructor`, `toString` and `__proto__` used as attribute names lex as identifiers; the existing OCL
   method messages still fire for the names in `OCL_METHOD_MESSAGES`, and a real keyword still lexes as a keyword.
3. JjScript: grep `frontend/src/jjscript/` for the same two patterns (`in <plain object>` and bracket lookups on
   keyword or message tables keyed by source text). Report each hit with `file:line`. Fix only an exact twin of the
   two lines above, with a test; anything else goes in the report as a ticket.
4. Gates: `npm run typecheck` from `frontend/` (the baseline is 14 errors; the set must not change); the vitest files
   under `src/jjel/` and `src/jjscript/`; `npm run check:docs`.
5. Commits: code and tests in one commit (pathspec, `Model:` trailer naming the model you actually run on), the
   log-inbox entry in a docs commit (P9), `Corregge: none` (RC-45 part 2).

## HARD STOP
After the commits: `Outcome: hard-stop`, with the red-then-green test names, the JjScript hits, the gate results and
the shas. Non-visual lane: the chat merges.

## DO NOT
No change outside DOVE. No `git stash`, no `git add .`. No dev server.

## REFERENCES
- `docs/PROTOCOL.md` P9, P13, P14, P16; RC-21, RC-45.
- `frontend/src/jjel/lexer/lexer.ts`.
