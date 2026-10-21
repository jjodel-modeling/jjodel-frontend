# Hardware demonstrator S-A2: finish the viewpoints after the context ceiling (implementation)

Prompt-ID: P-2026-10-21-1620
Chat: C-2026-10-20-2055
Front: hw-notation
Lane: full (continuation of P-2026-10-21-1545 after the AM-8 ceiling, RC-51)
Status: eseguito 2026-10-21 · lane hw-sa2 · 34a8a7ee7 · continuation of P-2026-10-21-1545 · Outcome: hard-stop (time limit; Datapath and Control miss the acceptance criterion) · verifica visiva in attesa (Alfonso)
Request: none (project chat without a shareable URL; Alfonso's words are kept locally through `lane-run start --request`)
Depends: P-2026-10-21-1545
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-hwdemo`, branch `hw-demo`, HEAD at the commit that adds this prompt. The tree is **expected
dirty**: the uncommitted work of P-2026-10-21-1545 (`frontend/scripts/examples/build-hw-cpu.ts`, the regenerated
`frontend/public/examples/hw/hw-cpu.jjodel`, untracked PNGs under `docs/discovery/assets/hw-sa2/`). Heavy tier
(RC-16), effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-10-21-1620 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 75 minutes. **Read the handoff first**
(`/Users/alfonso/.jjodel-lanes/P-2026-10-21-1545/handoff.md`, and `handoff.diff`), keep its decisions and follow its
«Remaining checks, in order»; do not re-read what it already reports, and do not re-read the plan. Use Explore
subagents for anything wider; probe output goes to files whose tails you read; look at each PNG once per rebuild.
**Commit the code as soon as typecheck and `npx vitest run src/codegen` are green** (step 5's code commit), even if a
viewpoint still misses the acceptance criterion; layout iterations after that are further small commits.

## COSA

Finish slice S-A2 exactly as P-2026-10-21-1545 (`docs/prompts/claude_2026-10-21_1545_prompt_hw_sa2_viewpoints.md`)
specifies it; its acceptance criterion, DOVE and gates stand unchanged. The live viewpoint switch that keeps the
previous positions is **not** fixed here (`useJjomSync.ts` is critical zone): the import check remounts the canvas
after the switch, as the handoff says, and the ticket records the defect with its evidence (positions measured
before and after the remount). If a viewpoint still fails the acceptance criterion after two layout iterations, stop
with `Outcome: hard-stop`, the screenshots committed and the failing items listed.

Docs closure for **both** Prompt-IDs: the Status line of the 1545 prompt (continued by 1620) and of this prompt; one
entry in `docs/log-inbox/hw-notation.md` (§21.3 taxonomy, `Causa: —`, Notes at most 500 characters, `Smoke visivo:`
pending Alfonso's look, the scope note that the import check lives in `build-hw-cpu.ts`); one ticket for the live
switch.

## DOVE

As the 1545 prompt. No critical-zone file. Do not name the industrial partner in any file.

## COME

Gates of the 1545 prompt. In the final message, for each viewpoint: criterion met or not, item by item, and the path
of its PNG. `git add` by path, `Model:` trailer. Remove the `frontend/node_modules` symlink and the `_tmp_` scratch at
the end (P14). No push, no merge.
