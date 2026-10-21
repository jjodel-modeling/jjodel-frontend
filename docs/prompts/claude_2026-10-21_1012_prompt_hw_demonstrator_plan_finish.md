# Hardware notation demonstrator: finish the plan after the context ceiling (discovery)

Prompt-ID: P-2026-10-21-1012
Chat: C-2026-10-20-2055
Front: hw-notation
Lane: full (continuation of P-2026-10-21-0950 after the AM-8 ceiling, RC-51; Phase 1 read-only)
Status: da eseguire
Request: none (project chat without a shareable URL; Alfonso's words are kept locally through `lane-run start --request`)
Depends: P-2026-10-21-0950
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-hwdemo`, branch `hw-demo`, HEAD at the commit that adds this prompt. The tree is **expected
dirty** with one untracked file, the report `docs/discovery/discovery_2026-10-21_hw_demonstrator_plan.md` written by
P-2026-10-21-0950, whose sections 0 to 8 are done and 9 to 13 read «(pending)». Read its handoff in
`/Users/alfonso/.jjodel-lanes/P-2026-10-21-0950/` if one exists. Heavy tier (RC-16), effort `xhigh`. Phase 1 only:
no product code is edited.

## Lane discipline

Every reply opens with `[P-2026-10-21-1012 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 60 minutes. **Commit the report as it stands first**
(one `docs:` commit, `git add` by path), then work section by section and commit after each. Read sections 0 to 8 of
the report, not the sources they cite again; open a source only to check a fact a new section needs.

## COSA

Write sections 9 to 13 of the report, consistent with the verdicts of §8 (the JjEL to Verilog printer for the
register-transfer subset as the centre; route A templates on `HwDesign` first, route B through JjTL and `VerilogAst`
second; the CPU of D4; the trace comparison of D5).

Add one thing the first session was not asked: **model checking with nuXmv** is part of the demonstrator (Alfonso,
2026-10-21). The simulator's computational model maps to the nuXmv vocabulary (`docs/spec/claude_spec_2026-09-13_computational_model.md`
§8; `VAR`, `DEFINE`, `TRANS`, frame condition), `word` domains map to `unsigned word[N]` / `signed word[N]`, and
`frontend/src/model/simulation/bvToSmv.ts` already prints bit-vector expressions (R-BV-8). There is no `.smv`
exporter yet. In §9 to §13 cover: the exporter of the CPU model to `.smv` (where it goes, what it reads, which parts of
the control FSM and of the σ attributes it can translate today); the structural properties generated from the model
without writing them by hand (no deadlock except `HALT`, every state returns to `FETCH`, at most one write per register
per cycle, every opcode has a path in the control); one or two domain properties written as `INVARSPEC`/`LTLSPEC`
(for example `PC` constant after `HALT`); how a counterexample comes back as a simulator scenario; whether `nuXmv` is
installed on this machine (`command -v nuXmv nuxmv NuSMV`) and how it would be installed (it is not in Homebrew;
say what the official distribution needs). Do not install anything.

Sections:

- §9 Risks for a live demonstration (performance at this model size, canvas risks on ports and handles, critical-zone
  files the build would touch, the two JjTL prerequisites of D1).
- §10 Slice plan: for each slice its files, tests, gates, dependencies and whether it fits one session under the 200k
  ceiling (split it if not). Expected shape: the JjEL to Verilog printer with its oracle against the operator table;
  `HwDesign` metamodel, viewpoints and the CPU model built by a script; simulation roles and a running program with a
  committed trace; route A templates and testbench; the trace comparison with Verilator; the `.smv` exporter and the
  structural properties; the JjTL prerequisites and route B on `VerilogAst`; a one-page README for the engineer. Mark
  which slices can run in parallel (disjoint files) and which the demo cannot do without.
- §11 Open questions. §12 Decisions taken (unattended). §13 Decisions awaiting Alfonso (RC-26 list only; what the
  demonstrator shows to the partner is his call, so the slice order and the route A/B choice for the demo go there
  with a `Recommended:` line each).

## DOVE

Write only `docs/discovery/discovery_2026-10-21_hw_demonstrator_plan.md`. Scratch under `frontend/.vite-cache/`. Do not
name the industrial partner in any file.

## COME

Commit the report first as it stands, then after each section, `git add` by path, `Model:` trailer. Hard stop at the
end with the report complete.
