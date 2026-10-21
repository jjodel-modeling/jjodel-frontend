# Hardware demonstrator S-A2: framed screenshots, the ports arcs and the guard-label overlap (fix)

Prompt-ID: P-2026-10-21-1810
Chat: C-2026-10-20-2055
Front: hw-notation
Lane: full (build track: the CPU build script and its import check only)
Status: da eseguire
Request: none (project chat without a shareable URL; Alfonso's words are kept locally through `lane-run start --request`)
Depends: P-2026-10-21-1620
Corregge: P-2026-10-21-1620

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-hwdemo`, branch `hw-demo`, at the commit that adds this prompt. Check `pwd`, branch, `git log -1`,
`git status`; otherwise stop. Link `frontend/node_modules` (P14), remove it at the end. Heavy tier (RC-16), effort
`xhigh`.

## Lane discipline

Every reply opens with `[P-2026-10-21-1810 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 45 minutes. Read only the final message of lane
P-2026-10-21-1620 (`~/.jjodel-lanes/P-2026-10-21-1620/log.jsonl`, last `result`), the function `verify` and the
view definitions in `frontend/scripts/examples/build-hw-cpu.ts`, and the two S-A2 tickets in
`docs/log-inbox/hw-notation.md`. Nothing else. Probe output to files; look at each PNG once per run. Commit each fix as
soon as it is green.

## COSA

Close the three items lane P-2026-10-21-1620 left open (its «Next lane, in order»):

1. Rerun the import check alone (`HWB_VERIFY_ONLY=1`) with the crop around the drawn nodes that 1620 wrote but did not
   run; fix it until the Datapath and Control screenshots show the whole viewpoint, framed, at a readable size.
2. Settle the 25 extra Datapath edges: are the `Component.ports` arcs visible on the canvas or is the check misreading
   them? If visible, make them invisible in the Datapath viewpoint's view (view level only); if a misread, fix the
   check.
3. **Decided by Alfonso (2026-10-21 18:08):** keep NOP's explicit transition and `dec_else` as two separate transitions
   (S-H needs `else` removable); separate their guard labels on the canvas by changing the view of one of the two
   DECODE→FETCH arcs (for example a different `curve` or label offset in the Control viewpoint). No change to the
   model, the spec or `hw-cpu.json` semantics.

Then regenerate the `.jjodel` if the views changed (the build, as before), replace the three PNGs under
`docs/discovery/assets/hw-sa2/`, and state for each viewpoint whether the acceptance criterion of P-2026-10-21-1545
now holds, item by item.

## DOVE

`frontend/scripts/examples/build-hw-cpu.ts`, the regenerated `frontend/public/examples/hw/hw-cpu.jjodel`, the three
PNGs. No file under `frontend/src` except what the build regenerates; no critical-zone file (`irEdgeViews.ts`,
`useJjomSync.ts`, `portDistribution.ts`, `DynamicHandles.tsx` stay untouched; the two tickets stay open). Do not name
the industrial partner in any file.

## COME

Gates: typecheck 0 through `node scripts/run-quiet.mjs`; `npx vitest run src/codegen` green (the run test still
reaches `ram_12 = 8'h2a`); `npm run check:docs`. Docs closure: the Status line; one entry in
`docs/log-inbox/hw-notation.md` (§21.3 taxonomy, `Corregge: P-2026-10-21-1620`, `Causa:` the unframed screenshots and
the label overlap, Notes at most 500 characters, `Smoke visivo:` pending Alfonso's look). `git add` by path, `Model:`
trailer. No push, no merge.
