# Hardware demonstrator S-D: finish route A after the context ceiling (implementation)

Prompt-ID: P-2026-10-21-1340
Chat: C-2026-10-20-2055
Front: hw-notation
Lane: full (continuation of P-2026-10-21-1300 after the AM-8 ceiling, RC-51)
Status: eseguito 2026-10-21 · lane hw-sd · 671dc5638 (continues P-2026-10-21-1300)
Request: none (project chat without a shareable URL; Alfonso's words are kept locally through `lane-run start --request`)
Depends: P-2026-10-21-1300
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-hwdemo`, branch `hw-demo`, HEAD at the commit that adds this prompt. The tree is **expected
dirty**: the uncommitted work of P-2026-10-21-1300 (new `frontend/src/codegen/target/verilog/access.ts`, edited
`frontend/src/codegen/engine/generate.ts` and `frontend/src/codegen/examples/hw-cpu/hw-cpu.json`, new
`…/hw-cpu/__tests__/hw-cpu.verilog.test.ts`, scratch under `scratch/`). Heavy tier (RC-16), effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-10-21-1340 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 60 minutes. The previous session hit the 200k ceiling in
14 minutes: **read the handoff first** (`/Users/alfonso/.jjodel-lanes/P-2026-10-21-1300/handoff.md` and
`handoff.diff` if present) and do not re-read what it already reports. Use Explore subagents for any wide reading,
send command output to files and read their tails, read only the functions you edit. **Commit the code as soon as
typecheck and the codegen tests are green** (one `feat(codegen): ...` commit, `git add` by path), before the build,
the lint and the docs closure, so a second ceiling stop never loses it.

## COSA

Finish slice S-D exactly as P-2026-10-21-1300 (`docs/prompts/claude_2026-10-21_1300_prompt_hw_sd_verilog_route_a.md`)
specifies it; that prompt's COSA, DOVE, COME and gates stand unchanged. Complete the remaining items of the handoff in
its order: the expected `cpu.v` and `tb.v`, the regenerated `.jjodel`, `verilator --lint-only` once with the result in
the commit body, then the docs closure for **both** Prompt-IDs: the Status line of the 1300 prompt
(`eseguito 2026-10-21 · lane hw-sd · <sha>`, continued by 1340) and of this prompt; one entry in
`docs/log-inbox/hw-notation.md` (§21.3 taxonomy, `Causa: —`, Notes at most 500 characters, mention the continuation).
Move the template sources out of `scratch/` only if the 1300 prompt's DOVE names a home for them; otherwise leave
them uncommitted and say so.

## DOVE

The files of the 1300 prompt's DOVE, nothing else under `frontend/src`. No critical-zone file. Do not name the
industrial partner in any file.

## COME

Gates of the 1300 prompt (typecheck 0 through `node scripts/run-quiet.mjs`, codegen and simulation vitest, build,
`npm run check:docs`). `git add` by path, `Model:` trailer. Remove the `frontend/node_modules` symlink at the end
(P14). No push, no merge.
