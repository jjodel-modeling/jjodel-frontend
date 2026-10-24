# Jjodie S4a: read-only effects planner for JjScript

Prompt-ID: P-2026-10-24-0137
Chat: C-2026-10-24-0020
Front: jjodie-ui
Lane: full (implementation S4a, no visual change)
Depends: P-2026-10-24-0115
Status: eseguito 2026-10-24 · lane jjodie-ui · e854a04c2 · gates green, bench 10/10
Corregge: none
Request: Alfonso, 2026-10-24 00:40 and 01:14, in the project chat (unattended run; S6 and one-step Apply approved)
Model: claude-opus-5-5

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is done (`docs/discovery/discovery_2026-10-24_jjodie_panel_jjel_live.md`). P8 does not apply (nothing visible).

Worktree: `~/jjodel-w-jjp-s4a`, branch `jjp-s4a`, cut from `jjodie-panel` at `9dc2f3c6e` plus the commit that adds
this prompt. Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the `frontend/node_modules`
symlink may show). Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-10-24-0137 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list: Alfonso is asleep. Critical-zone files (CLAUDE.md §3.2) are not authorised: if
one is needed, stop. Time limit: 75 minutes. No subagents, no background tasks. Commit as soon as the gates are green.
One probe run per tool call. Context discipline (the first lane of this front stopped at the 200k ceiling): never `cat`
a whole large file or log; test and build output is read through `tail` or `grep` of the summary lines. Subject lines
without `(P-...)` suffix, Prompt-ID in the body, `Model:` trailer. Close with the log-inbox entry (skill `log-entry`)
and the Status flip in one docs-only commit. Nothing merges anywhere: the chat merges `jjp-s4a` into `jjodie-panel`.

## Read first, and only this

The report: Q2, Q7 (row S4a), «Decisions taken», «Dependencies and risks». The rows R-JJD-1..6 in `docs/decisions.md`
(section «R-JJD»).

## COSA

Slice S4a under R-JJD-2 and R-JJD-4: a pure, read-only effects planner for JjScript, a new module next to
`referenceWrite.ts` (for example `jjscript/executor/effectsPlanner.ts`, grep the name first), extending the
`consumerProposalModel.readProposal` pattern. Given a parsed script and the current model (read only through the
existing lookups), it returns: created objects (metaclass, name, container path), set or appended features, created
references (source, feature, target, including targets created earlier in the same script), warnings (unknown
metaclass or feature, one end written of an opposite pair, unresolvable target), and the first error with its line.
It never writes to the store, never dispatches, never opens a transaction.

Scope: M1 commands (create instance, set, `+=`, reference writes). M2 commands are a follow-up lane: the planner
returns a single `unsupported: <command>` warning for them. Re-check multi-valued attribute `=` semantics against the
executor before encoding them (the report marks it «not measured») and write the answer in the log entry.

Tests first: one test per command kind and per warning. The executor does not import under vitest
(`window is not defined`): extract nothing from it in this lane, and quote in a comment the executor lines each
planner rule mirrors. Mutation bench: at least five mutants, all killed.

Gates: typecheck at the baseline of CLAUDE.md §17, vitest (summary lines), build. Commit
(`feat(jjscript): read-only effects planner`).

## HARD STOP

None: close with the docs commit and `Outcome: done`.

## NON FARE

No edit to the executor, to `reducer.ts` or to any UI file. No merge, no push.
