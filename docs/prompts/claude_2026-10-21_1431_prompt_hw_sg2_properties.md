# Hardware demonstrator S-G2: structural properties generated from the model (implementation)

Prompt-ID: P-2026-10-21-1431
Chat: C-2026-10-20-2055
Front: hw-notation
Lane: full (one simulation module, its tests and goldens)
Status: da eseguire
Request: none (project chat without a shareable URL; Alfonso's words are kept locally through `lane-run start --request`)
Depends: P-2026-10-21-1341
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-hwprops`, branch `hw-props`, cut from `hw-demo` at the commit that adds this prompt; it merges back into `hw-demo`, not into the trunk. Check `pwd`, branch, `git log -1`, `git status`; otherwise stop. Link
`frontend/node_modules` (P14), remove it at the end. Heavy tier (RC-16), effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-10-21-1431 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 60 minutes. Six lanes of this front hit the 200k ceiling,
two of them in 14 minutes: **read only the plan entry named below and the functions you edit**; use Explore subagents
for anything wider; send command output to files under `.agent-logs/` and read their tails. **Commit the code as soon
as typecheck and the slice's tests are green** (one code commit, `git add` by path), before the build, any probe, the
mutation bench and the docs closure, so a ceiling stop never loses it. If the ceiling hook fires, write the handoff
with the remaining steps in order.

## COSA

Implement slice **S-G2** exactly as the plan states it: `docs/discovery/discovery_2026-10-21_hw_demonstrator_plan.md`
§10.1 entry «S-G2 — the structural properties, generated from the model» (items 1 to 6, including the free-ROM
variant and the graph check in the exporter). Read that entry, the S-G1 entry above it and
`frontend/src/model/simulation/smvExport.ts` (written by P-2026-10-21-1301/1341); nothing else of the plan. Keep the
S-G1 decisions recorded in that file and in its log entry (names, `DEFINE` for derived attributes). The per-opcode
instances of item 4 are **not** in this slice (S-H prints them from a template); here only the generic free-ROM
export and the `DECODE` instance of item 1.

Every property is generated, none written by hand, each named after the element it is about. What the exporter
proves statically (item 2's graph check, item 3 on named targets, item 6 when the cells cover the index's width) is
reported in the result next to the text, so S-H can show it without nuXmv. Do not install or run nuXmv.

## DOVE

`frontend/src/model/simulation/smvExport.ts`, its test and the goldens under `…/__tests__/fixtures/`. No other file
under `frontend/src`; no simulator engine file (`netStep.ts`, `netTypes.ts`, `bvToSmv.ts` read only). No critical-zone
file. Do not name the industrial partner in any file.

## COME

Gates: typecheck 0 through `node scripts/run-quiet.mjs`; `npx vitest run src/model/simulation src/codegen` green;
`npm run build`; `npm run check:docs`. A mutation bench in the commit body (at least: a property dropped, a sibling
pair missed by item 5, the graph check ignoring one edge). Docs closure: the Status line; one entry in
`docs/log-inbox/hw-notation.md` (§21.3 taxonomy, `Causa: —`, Notes at most 500 characters). `git add` by path,
`Model:` trailer. No push, no merge.
