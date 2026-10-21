# Hardware demonstrator S-A2: the three viewpoints ISA, datapath and control (implementation)

Prompt-ID: P-2026-10-21-1545
Chat: C-2026-10-20-2055
Front: hw-notation
Lane: full (build track: the CPU build script, the regenerated project, an import probe with screenshots)
Status: eseguito 2026-10-21 · lane hw-sa2 · 34a8a7ee7 · continued by P-2026-10-21-1620 after the AM-8 ceiling · Outcome: hard-stop (time limit; Datapath and Control miss the acceptance criterion) · verifica visiva in attesa (Alfonso)
Request: none (project chat without a shareable URL; Alfonso's words are kept locally through `lane-run start --request`)
Depends: P-2026-10-21-1340
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-hwdemo`, branch `hw-demo`, the integration branch of the demonstrator, at the commit that adds
this prompt. Check `pwd`, branch, `git log -1`, `git status`; otherwise stop. Link `frontend/node_modules` (P14), remove
it at the end. Heavy tier (RC-16), effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-10-21-1545 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 75 minutes. Six lanes of this front hit the 200k ceiling,
two of them in 14 minutes: **read only the plan entry named below, the gallery code you copy and the functions you
edit**; use Explore subagents for anything wider; send command output to files under `.agent-logs/` and read their
tails. **Commit the code as soon as typecheck and the codegen example tests are green** (one code commit, `git add` by
path), before the probe, the screenshots and the docs closure. If the ceiling hook fires, write the handoff with the
remaining steps in order.

## COSA

Implement slice **S-A2** exactly as the plan states it: `docs/discovery/discovery_2026-10-21_hw_demonstrator_plan.md`
§10.1 entry «S-A2 — the three viewpoints of D2 (ISA, datapath, control)», with the constraints R3, R4, R10, R11 it
cites (ports as vertices, wires as objects-as-edges, no nesting, no derived viewpoint). Read that entry and the
rows R3, R4, R10, R11 of the plan, nothing else of it. The viewpoints are built by `build-hw-cpu.ts` through `view.ir`,
following the gallery pattern of R-LIB-9 (`build-gallery.ts`); then regenerate `frontend/public/examples/hw/hw-cpu.jjodel`
through the app's export as S-A1 and S-B did.

**Acceptance criterion, written before the run (CLAUDE.md §5).** In the imported project, each of the three viewpoints
opens without page errors and shows: ISA, the instruction formats with their fields and bit ranges and the ten
opcodes, readable at 100% zoom; datapath, every component as a node with its typed ports as vertices on its border,
every wire as an edge from port to port, no edge ending in empty space, no two nodes overlapping; control, the eleven
states and every transition, each transition labelled with its guard, FETCH placed first. Play on the control
viewpoint still reaches `ram_12 = 8'h2a` (the S-B run test stays green).

## DOVE

`frontend/scripts/examples/build-hw-cpu.ts`, `frontend/src/codegen/examples/hw-cpu/hw-cpu.json` only if the build
script writes viewpoints there, the regenerated `.jjodel`, and the import probe's arguments if it needs a viewpoint
list. **No edit** of `portDistribution.ts`, `DynamicHandles.tsx`, `useJjomSync.ts` or any file of plan §3.1; if a
viewpoint needs one, stop with `Outcome: question`, the screenshot and the smallest change you would make. Do not
name the industrial partner in any file.

## COME

Gates: typecheck 0 through `node scripts/run-quiet.mjs`; `npx vitest run src/codegen` green; `npm run build`;
`npm run check:docs`. Visual smoke: the import probe with one screenshot per viewpoint, saved under
`docs/discovery/assets/hw-sa2/` (committed, PNG, longest side at most 1600 px); state in the final message, for each
viewpoint, whether the acceptance criterion holds, with the path of its screenshot. Docs closure: the Status line; one
entry in `docs/log-inbox/hw-notation.md` (§21.3 taxonomy, `Causa: —`, Notes at most 500 characters, `Smoke visivo:`
pending Alfonso's look). `git add` by path, `Model:` trailer. No push, no merge.
