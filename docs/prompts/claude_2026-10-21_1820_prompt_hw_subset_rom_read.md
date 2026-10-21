# Subset checker: accept the ROM read bits(w, <memory idiom>) that the .smv exporter translates (fix)

Prompt-ID: P-2026-10-21-1820
Chat: C-2026-10-20-2055
Front: hw-notation
Lane: full (one simulation module and its test)
Status: eseguito 2026-10-21 · lane hw-subset · 1a85c93d3
Request: none (project chat without a shareable URL; Alfonso's words are kept locally through `lane-run start --request`)
Depends: P-2026-10-21-1431
Corregge: P-2026-10-21-1145

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-hwsubset`, branch `hw-subset`, cut from `hw-demo` at the commit that adds this prompt; it merges back into `hw-demo`.
Check `pwd`, branch, `git log -1`, `git status`; otherwise stop. Link `frontend/node_modules` (P14), remove it at the
end. Heavy tier (RC-16), effort `xhigh`.

## Lane discipline

Every reply opens with `[P-2026-10-21-1820 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 45 minutes. Read only the files named below and the
functions you edit; send command output to files and read their tails. Commit as soon as the gates are green.

## COSA

Ticket «Subset checker flags the hw-cpu ROM read bits(8, c.init) as E-CALL» in `docs/log-inbox/hw-notation.md`:
`frontend/src/model/simulation/subsetChecker.ts:320-321` accepts `bits`/`sbits` only when every argument is a literal,
so FETCH's ROM read `bits(8, rom.cells.filter(…).first.init)` is reported as E-CALL and the code panel of the
demonstrator shows «1 defect». The `.smv` exporter (`smvExport.ts`, S-G1/S-G2) already translates that read through
the memory idiom (`frontend/src/model/simulation/memoryIdiom.ts`).

Make the checker accept `bits(w, x)` / `sbits(w, x)` when `w` is a literal and `x` is either a literal or an
expression that `memoryIdiom.ts` recognises (reuse its recogniser; do not duplicate the pattern). Every other case
keeps today's verdict. Tests: the hw-cpu FETCH read accepted; `bits(8, someAttr)` with a non-idiom argument still
E-CALL; `bits(n, 3)` with a non-literal width still E-CALL; the hw-cpu model reports zero defects; the existing
subset-checker tests unchanged and green.

## DOVE

`frontend/src/model/simulation/subsetChecker.ts` and its test. `memoryIdiom.ts` read only (an added export is allowed
if the recogniser is not exported today; say so). No critical-zone file. Do not name the industrial partner.

## COME

Gates: typecheck 0 through `node scripts/run-quiet.mjs`; `npx vitest run src/model/simulation src/codegen` green;
`npm run build`; `npm run check:docs`. Docs closure: the Status line; close the ticket by an entry in
`docs/log-inbox/hw-notation.md` (§21.3 taxonomy, `Corregge: P-2026-10-21-1145`, `Causa:` the literal-only rule of
R-BV-8 predating the memory idiom, Notes at most 500 characters). `git add` by path, `Model:` trailer. No push, no
merge.
