# log-inbox — lane «jjel-lexer-own-keys»

Entries written by the jjel-lexer-own-keys lane while sessions share this tree (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-10 — fix: JjEL lexer looks up OCL messages and keywords by own key
**Prompt**: JjEL lexer.ts tested `text in OCL_METHOD_MESSAGES` and read `JJEL_KEYWORDS[textLower]` on plain objects, so Object.prototype names matched: `x.toString()` failed with the native function as the message, and `constructor` / `__proto__` did not lex as identifiers. Make both lookups own-key only, with tests red first; grep JjScript for the same two patterns and fix only an exact twin.
**Files touched**: frontend/src/jjel/lexer/lexer.ts, frontend/src/jjel/__tests__/lexer-own-keys.test.ts (455792c69); closure commit: docs/log-inbox/jjel-lexer-own-keys.md
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Map built at module load from Object.entries, not Object.hasOwn (Vite default target Safari 14 lacks it, no polyfill). 15 of 20 new tests red on the old lexer, 20 green on the new. jjel 299 green; jjscript 840 green plus the known context-binding import failure; typecheck 14, same set. JjScript lexer uses arrays and .includes: no twin; other hits in the ticket below.
**Prompt document name**: 2026-10-10 17:56

## 2026-10-10 — ticket: JjScript looks up tables and variable maps keyed by source text on plain objects
**Ticket**: Same family as the JjEL lexer fix, found by reading, not exercised. Table lookups keyed by user text: `frontend/src/jjscript/parser/grammar.ts:224` `TYPE_ALIASES[raw]` (a type named `constructor` yields a function as the primitive type); `frontend/src/jjscript/executor/commands/create.ts:88` `PRIMITIVE_ATTRIBUTE_TYPES[raw.trim().toLowerCase()] ?? null` (returns a function typed as string). Variable maps on `in`: `frontend/src/jjscript/executor/commands/eval.ts:44`, `:318`, `:372` (`variables` is a plain `{}` at `:126`) and `:261` (`nm in classObj`), so a variable or class named `toString` reads as already bound. Lower risk, keys constrained by the parser or taken from the model: `executor/commands/delete.ts:192` `TYPE_TOKENS[elementType.toLowerCase()]`, `executor/commands/set.ts:306` `SET_TYPE_RULES[className]`; deliberate probes on live objects: `executor/resolvers.ts:735` and `executor/commands/set.ts:207` (`in element`). The JjScript lexer (`parser/lexer.ts:372-389`) uses arrays with `.includes` and is not affected.
**Priority**: low
**Found in**: P-2026-10-10-1756

## 2026-10-10 — merge: jjel-lexer-own-keys into alfonso-frontend-jjtl (P-2026-10-10-1817)
**Prompt**: `claude_2026-10-10_1817_prompt_merge_jjel-lexer-own-keys.md`, a direct merge by `lane-run merge --direct`, no session: `jjel-lexer-own-keys` at `b1b1599ba` into `alfonso-frontend-jjtl`, merge base `6ca224b68`, 2 commits on the branch side.
**Files touched**: merge `0d2ad8f11`: 3 files from the branch side (`docs/log-inbox/jjel-lexer-own-keys.md`, `frontend/src/jjel/__tests__/lexer-own-keys.test.ts`, `frontend/src/jjel/lexer/lexer.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `0d2ad8f11` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 8052 tests in 330 files, 9 red at import, hooks 487; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: non-visual: JjEL lexer own-key lookups, 20 tests green; RC-45 drawn lane (light)
**Notes**: Rollback tag `pre-jjel-lexer-own-keys` on `834152b68` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-10-1817/result.json`.
**Prompt document name**: 2026-10-10 18:17
