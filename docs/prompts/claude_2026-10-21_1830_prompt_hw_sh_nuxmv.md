# Hardware demonstrator S-H: nuXmv on the CPU, two domain properties, counterexamples as scenarios (implementation)

Prompt-ID: P-2026-10-21-1830
Chat: C-2026-10-20-2055
Front: hw-notation
Lane: full (build track plus scripts/oracle, one package.json line, a pure simulation module)
Status: da eseguire
Request: none (project chat without a shareable URL; Alfonso's words are kept locally through `lane-run start --request`)
Depends: P-2026-10-21-1431
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-hwdemo`, branch `hw-demo`, at the commit that adds this prompt. Check `pwd`, branch, `git log -1`,
`git status`; otherwise stop. Link `frontend/node_modules` (P14), remove it at the end. Heavy tier (RC-16), effort
`xhigh`.

## Lane discipline

Every reply opens with `[P-2026-10-21-1830 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 90 minutes. Seven lanes of this front hit the 200k
ceiling: **read only the plan entry named below, `smvExport.ts`'s exported API and `scenarioCodec.ts:40-70`**; use
Explore subagents for anything wider; nuXmv output goes to files under `.agent-logs/`, read their tails. **Commit in
this order, each as soon as it is green:** (1) the run script with its version check and the committed verdicts;
(2) `smvTrace.ts` with its test; (3) the build-track part (`cpu-decode-gap`). If the ceiling hook fires, write the
handoff with the remaining steps in order.

## COSA

Implement slice **S-H** exactly as the plan states it: `docs/discovery/discovery_2026-10-21_hw_demonstrator_plan.md`
§10.1 entry «S-H — nuXmv on the CPU: the run script, two domain properties, counterexamples as scenarios». Read that
entry and the S-G2 entry above it, nothing else of the plan.

nuXmv 2.2.0 is installed since 2026-10-21 18:25: `~/.local/bin/nuXmv` (a wrapper of
`~/opt/nuXmv-2.2.0/usr/local/bin/nuXmv.sh`, which sets the library path; call it by that name, not the inner binary).
The script finds it on `PATH` or through `NUXMV`, and prints a clear message when it is missing. A full BDD run on
`hw-cpu.smv` takes longer than a few seconds: choose the engine per variant as the plan's R14 says, and record the
time of each check in `hw-cpu.mc.json`.

Two findings from S-G2 (P-2026-10-21-1431) you must honour:

1. Because of `dec_else`, the item-1 instance at `DECODE` holds by construction in the free-ROM export. The
   per-opcode instances printed by the `smvIsa` template must be checked on an export **without** `dec_else` (that is
   the `cpu-decode-gap` model of the plan, DECODE without its `else`), so that a missing opcode yields a counterexample
   whose ROM names it.
2. `SmvExportResult.properties` is now required; read it, do not re-derive the properties.

Alfonso decided (2026-10-21 18:08) that NOP's explicit transition and `dec_else` stay two separate transitions in the
main model; do not merge them.

## DOVE

The files the plan entry lists (`frontend/scripts/oracle/hw-cpu-nuxmv.mjs`, `frontend/package.json` script `mc:hw`,
`frontend/src/model/simulation/smvTrace.ts` and its test, `hw-cpu.properties.smv`, `hw-cpu.mc.json`,
`build-hw-cpu.ts`, `hw-cpu.json`, the regenerated `.jjodel`). No engine file, no critical-zone file. Do not name the
industrial partner in any file.

## COME

Gates: typecheck 0 through `node scripts/run-quiet.mjs`; `npx vitest run src/model/simulation src/codegen` green;
`npm run mc:hw` exit 0 with the verdicts expected (structural properties true on the CPU; the two domain properties
true; the decode-gap instance false with a counterexample replayed by the step loop); `npm run build`;
`npm run check:docs`. Docs closure: the Status line; one entry in `docs/log-inbox/hw-notation.md` (§21.3 taxonomy,
`Causa: —`, Notes at most 500 characters, the nuXmv version and the check times). `git add` by path, `Model:` trailer.
No push, no merge.
