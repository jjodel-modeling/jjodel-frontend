# Code generation for 3.2, slice S6: the JjEL member guard

Prompt-ID: P-2026-10-23-2105
Chat: C-2026-10-22-1050
Front: release-3-2
Lane: full (implementation; the JjEL evaluator, shared by templates, validation rules, viewpoints and the simulator; no critical-zone file)
Depends: P-2026-10-23-2030
Status: eseguito 2026-10-23 · lane codegen · bf9bde96b · bench 13/13 killed, no expectation changed · lazy gate on green, off not run · visual check owed by the chat (RC-23)
Corregge: none
Request: Alfonso, 2026-10-23 20:06, in the project chat: prototype reads in JjEL (`getProperty` uses `property in obj`, so `x.constructor` and `x["__proto__"]` are readable although no native function can be called)

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is done (`docs/discovery/discovery_2026-10-23_codegen_textmode_safety.md`). P8 replaced: the chat runs the visual check after the merge (RC-23).

Worktree: `~/jjodel-w-cgsafety`, branch `cg-safety`, at `e69e7678f` (S5, merged into the trunk at `adb481e80`) plus the commit that adds this prompt. Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the `frontend/node_modules` symlink may show).

Model and tier: as `lane-run start` assigns.

## Lane discipline
Every reply opens with `[P-2026-10-23-2105 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 90 minutes. No subagents, no background tasks. Commit as soon as the gates are green. One probe run per tool call. If the context gets heavy, write a handoff in the lane folder and stop with `Outcome: hard-stop`.

## Read first, and only this
The discovery report: §0, §3 (the probe, every path that resolves a member, the guard), the S6 row of §5 and the rows of §6 that concern the guard. They are the specification of this slice.

## COSA
1. The guard of §3.3, in both forms, on every member path §3.2 lists (dot, `?.`, index, interpolation holes, method tables): `__proto__` and the names inherited from `Object.prototype` read as missing; a member read never yields a native function; method tables resolve own keys only; a literal `__proto__` key in an object literal is an own key. Own attributes named `constructor` or `toString` stay readable, and L-proxy values keep working.
2. Tests that pin it: every read of the §3.1 probe turns into «missing» (or the evaluator's usual error for a missing member); `xs.map(x.toString)` and `"abc".replace("a", x.toString)` no longer invoke a native function; own `constructor`/`toString` attributes still read; a mutation bench (guard removed on one path at a time) where each mutant is killed.
3. Regression: the whole `src/jjel` suite plus the suites of the evaluator's other users (validation rules, IR/viewpoint expressions, the simulator) green with no expectation changed; list any test whose expectation had to change and why, and stop with `Outcome: question` if one is a behaviour a user could rely on.
4. Gates: typecheck, build, `npx vitest run src/jjel src/codegen src/model/simulation src/components/editor-v2`, `npm run check:codegen-lazy` in the «on» mode.
5. One docs commit: the log entry in `docs/log-inbox/codegen.md` (or `jjel` if that inbox exists), this prompt's `Status:` line.

## DOVE
The evaluator files of the S6 row of §5 (under `frontend/src/jjel/`) and their tests; `docs/log-inbox/`; this prompt file.

## NON FARE
No limits or worker changes (S7), no UI change; no change to the JjEL grammar; nothing in the critical zone; no new dependency. No push, no merge.
