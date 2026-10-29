# JjEL bit-vector values, slice S1: closure of the uncommitted work (gates, commits)

Prompt-ID: P-2026-10-20-2350
Chat: C-2026-10-20-2055
Front: hw-notation
Lane: full (continuation of P-2026-10-20-2331 after the context ceiling, RC-51; the code is written and uncommitted)
Status: eseguito 2026-10-20 · lane jjel-bitvector · de0ce082c
Request: none (project chat without a shareable URL; Alfonso's words are kept locally through `lane-run start --request`)
Depends: P-2026-10-20-2331
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-bitvector`, branch `jjel-bitvector`, HEAD at the commit that adds this prompt. The tree is
**expected dirty**: 5 modified and 3 new files under `frontend/src/jjel/` written by P-2026-10-20-2331 (its
`handoff.diff` in `/Users/alfonso/.jjodel-lanes/P-2026-10-20-2331/`). Check that `git status` matches that list and
that `git diff` matches the handoff diff; otherwise stop. Link `frontend/node_modules` (P14), remove it at the end.
Model and tier: heavy (RC-16), effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-10-20-2350 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 60 minutes. Keep the context small: do not read the
whole evaluator or the discovery again; read `/Users/alfonso/.jjodel-lanes/P-2026-10-20-2331/handoff.md` and only the
sections of `docs/discovery/discovery_2026-10-20_jjel_bitvector.md` you cite (§10 for the rows, §13 for the bench).
No push, no merge. Do not change product code unless a gate fails; a failing gate is reported with `Outcome: question`.

## COSA, COME

1. Re-run the four-folder gate `npx vitest run src/jjel src/jjtl src/model/simulation src/codegen` (expected: all
   green but the seven known `window is not defined` jjtl files of CLAUDE.md §17), and the typecheck through
   `run-quiet`.
2. Re-run the mutation bench with `/Users/alfonso/.jjodel-lanes/P-2026-10-20-2331/bench.mjs` (or its equivalent),
   output to a file, and record for each mutation one killing test. Mutations killed only by golden rows are fine:
   name the golden row.
3. The `feat(jjel): bit-vector values in the evaluator (P-2026-10-20-2331)` commit with the eight files by path and
   the killers in the body, `Model:` trailer.
4. The docs closure commit: `docs/decisions.md` rows R-BV-1, 3, 4, 5, 6 rewritten with the amendments of the
   discovery §10 (header `provisional, unattended`, `evidence: measured` or `read`, `verified: none`,
   `reversible: trunk`; only those values parse, check with `npm run -s docs:digest`), R-BV-2 with the `null`
   precision; R-BV-4 also states the measured limit: `x.and(y)`, `x.or(y)`, `x.not()` are implemented but do not parse
   until the parser accepts a keyword after `.`; the Status lines of the prompts of P-2026-10-20-2055,
   P-2026-10-20-2331 and of this prompt; one log-inbox entry for the three; `npm run check:docs` green.

## NON FARE

No parser change (the keyword-member limit goes to its own lane, written by the chat). No file outside the eight of
S1 and the docs above. Do not name the industrial partner.
