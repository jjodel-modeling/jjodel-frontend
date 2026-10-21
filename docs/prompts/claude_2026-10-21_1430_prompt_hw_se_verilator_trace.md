# Hardware demonstrator S-E: the trace comparison with Verilator (implementation)

Prompt-ID: P-2026-10-21-1430
Chat: C-2026-10-20-2055
Front: hw-notation
Lane: full (scripts/oracle, one package.json line, a committed trace and a normal-suite test)
Status: eseguito 2026-10-21 · lane full · 054dd604b
Request: none (project chat without a shareable URL; Alfonso's words are kept locally through `lane-run start --request`)
Depends: P-2026-10-21-1340
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-hworacle`, branch `hw-oracle`, cut from `hw-demo` at the commit that adds this prompt; it merges back into `hw-demo`, not into the trunk. Check `pwd`, branch, `git log -1`, `git status`; otherwise stop. Link
`frontend/node_modules` (P14), remove it at the end. Heavy tier (RC-16), effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-10-21-1430 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 60 minutes. Six lanes of this front hit the 200k ceiling,
two of them in 14 minutes: **read only the plan entry named below and the functions you edit**; use Explore subagents
for anything wider; send command output to files under `.agent-logs/` and read their tails. **Commit the code as soon
as typecheck and the slice's tests are green** (one code commit, `git add` by path), before the build, any probe, the
mutation bench and the docs closure, so a ceiling stop never loses it. If the ceiling hook fires, write the handoff
with the remaining steps in order.

## COSA

Implement slice **S-E** exactly as the plan states it: `docs/discovery/discovery_2026-10-21_hw_demonstrator_plan.md`
§10.1 entry «S-E — the trace comparison with Verilator (D5)» and the trace format of §7.4. Read those two places and
nothing else of the plan.

1. New `frontend/scripts/oracle/hw-cpu-verilator.mjs`, a sibling of `bv-verilator.mjs` and
   `bv-printer-verilator.mjs` (reuse their version check and temp-dir handling): it builds the committed
   `frontend/src/codegen/examples/hw-cpu/expected/cpu.v` and `tb.v` with `verilator --binary --timing -Wno-WIDTH`
   (the plan's build line), runs the binary, writes `frontend/src/codegen/examples/hw-cpu/hw-cpu.verilator.trace`, and
   compares it line by line with `hw-cpu.trace.json`. On a mismatch it prints the first diverging cycle and the
   register (or state) that differs, and exits 1.
2. `frontend/package.json`: one script `oracle:hw`, no dependency.
3. A normal-suite test (the `bitvectorOracle.test.ts` pattern) that the committed Verilator trace equals
   `hw-cpu.trace.json` without running Verilator, and that it is stale-proof (it fails if `cpu.v` or `tb.v` changes
   without a new `npm run oracle:hw`, for example through a hash of the two files recorded in the trace header).
4. Mutation: change one transfer in a scratch copy of `cpu.v` (not the committed file) and show in the commit body
   that the script names the first diverging cycle and register.

Lane P-2026-10-21-1300 already ran the simulation once by hand: 171 lines, all equal. If the committed trace differs,
stop with `Outcome: question` and the first diverging line; do not edit `cpu.v`, `tb.v` or the templates.

## DOVE

The files above only. No file under `frontend/src` except the new trace and the new test. No critical-zone file. Do
not name the industrial partner in any file.

## COME

Gates: typecheck 0 through `node scripts/run-quiet.mjs`; `npx vitest run src/codegen` green; `npm run oracle:hw`
exit 0; `npm run check:scripts`; `npm run build`; `npm run check:docs`. Docs closure: the Status line; one entry in
`docs/log-inbox/hw-notation.md` (§21.3 taxonomy, `Causa: —`, Notes at most 500 characters). `git add` by path,
`Model:` trailer. No push, no merge.
