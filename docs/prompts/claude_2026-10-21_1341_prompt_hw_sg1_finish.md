# Hardware demonstrator S-G1: finish the nuXmv .smv exporter after the context ceiling (implementation)

Prompt-ID: P-2026-10-21-1341
Chat: C-2026-10-20-2055
Front: hw-notation
Lane: full (continuation of P-2026-10-21-1301 after the AM-8 ceiling, RC-51)
Status: da eseguire
Request: none (project chat without a shareable URL; Alfonso's words are kept locally through `lane-run start --request`)
Depends: P-2026-10-21-1301
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-hwsmv`, branch `hw-smv`, HEAD at the commit that adds this prompt. The tree is **expected
dirty**: the uncommitted work of P-2026-10-21-1301 (`frontend/src/model/simulation/smvExport.ts`, its test and the
goldens under `…/__tests__/fixtures/`). Heavy tier (RC-16), effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-10-21-1341 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 60 minutes. The previous session hit the 200k ceiling in
14 minutes, before any gate ran: **read the handoff first** (`/Users/alfonso/.jjodel-lanes/P-2026-10-21-1301/handoff.md`
and `handoff.diff` if present) and keep its decisions; do not re-read what it already reports. Use Explore subagents
for any wide reading, send command output to files and read their tails, read only the functions you edit. **Commit
the code as soon as typecheck and the exporter tests are green** (one `feat(sim): ...` commit, `git add` by path),
before the mutation bench and the docs closure.

## COSA

Finish slice S-G1 exactly as P-2026-10-21-1301 (`docs/prompts/claude_2026-10-21_1301_prompt_hw_sg1_smv_exporter.md`)
specifies it; that prompt's COSA, DOVE, COME and gates stand unchanged. Complete the remaining items of the handoff in
its order (goldens, round trip on the committed S-B trace, mutation bench), then the docs closure for **both**
Prompt-IDs: the Status line of the 1301 prompt (`eseguito 2026-10-21 · lane hw-smv · <sha>`, continued by 1341) and
of this prompt; one entry in `docs/log-inbox/hw-notation.md` (§21.3 taxonomy, `Causa: —`, Notes at most 500
characters, mention the continuation and the handoff's declared deviation on derived attributes as `DEFINE`). Do not
install nuXmv.

## DOVE

The four files of the 1301 prompt's DOVE, nothing else under `frontend/src`. No critical-zone file. Do not name the
industrial partner in any file.

## COME

Gates of the 1301 prompt (typecheck 0 through `node scripts/run-quiet.mjs`, simulation vitest, build,
`npm run check:docs`). `git add` by path, `Model:` trailer. Remove the `frontend/node_modules` symlink at the end
(P14). No push, no merge.
