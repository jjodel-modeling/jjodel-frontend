# Simulation and semantics documentation, continuation

Prompt-ID: P-2026-10-20-0035
Chat: C-2026-10-20-0004
Front: simulator
Lane: full (continuation of P-2026-10-20-0015 after the AM-8 context ceiling)
Depends: P-2026-10-20-0015
Request: none (continuation; the request is kept with P-2026-10-20-0015)
Status: da eseguire

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: same as P-2026-10-20-0015 (no two-phase hard stop; documentation only).

Worktree: `~/jjodel-w-simdocs`, branch `sim-docs`, head is the commit that adds this prompt (parent `65cad6f72`), clean. Before anything else: `pwd`, branch, `git log -1` and `git status` are as stated here. Otherwise stop.

## Lane discipline
Every reply of this session opens with `[P-2026-10-20-0035 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.

## Contesto (non rifare l'analisi)

Lane P-2026-10-20-0015 completed the whole read phase and stopped on the AM-8 context ceiling before writing any file. Its handoff is `/Users/alfonso/.jjodel-lanes/P-2026-10-20-0015/handoff.md` (evidence with `file:line`, twelve findings, the full text of `simulation-semantics.md` in the appendix, the worked example design and the guide outline, the closing steps). Read the handoff first and work from it. Do not repeat the read phase: open a source file only to confirm a specific `file:line` the handoff cites, or to fill a gap the handoff names.

The task, scope, writing rules and NON FARE of `docs/prompts/claude_2026-10-20_0015_prompt_sim_semantics_docs.md` apply unchanged. Read that prompt once.

Decisions on the four items the handoff raised (taken by the project chat; amendments of ratified rows stay with Alfonso):
- A1: document `singleToken`, `noEpsilon`, `deterministic` as declared but not enforced today (R-SIM-49 plans a validation viewpoint).
- A2: document the code behaviour (an out-of-domain initial value is reported at Reset and still applied). Whether Reset should refuse the run is listed in the report under "Decisions awaiting Alfonso".
- A3: document a scenario's `expect` as stored and checked on replay but not settable from the UI today.
- A4: document the panel behaviour (`Running` shown where some press would ask for an input value, per R-SIM-88). The amendment line to R-SIM-29 is not written by this lane: list it under "Decisions awaiting Alfonso".

## COSA
1. Write `docs/discovery/discovery_2026-10-20_sim_semantics_docs.md` from the handoff (structure as in P-2026-10-20-0015 Step 1).
2. Write `docs/help/simulation/simulation-semantics.md` from the handoff appendix; check it against the writing rules (no em dashes except inside the standard TODO screenshot placeholder, at most two admonitions, no H4).
3. Write `docs/help/simulation/simulation-guide.md` from the outline and the worked example.
4. Index line in `docs/help/` if an index exists; log entry in `docs/log-inbox/simulation.md`; flip the Status line of both P-2026-10-20-0015 and this prompt; one docs commit with explicit pathspec; run `check:docs` if it exists. Exit with `Outcome: done`.

## HARD STOP
- Any need to touch a file outside `docs/`: stop.
- If the context climbs near the ceiling again, commit what is written first, then hand off.

## NON FARE
- No change to code, tests, `docs/decisions.md`, the spec or any memo. No new R- row. No push.
