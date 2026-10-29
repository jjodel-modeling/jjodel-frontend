# Code panel: a run result holding a bit-vector must not crash the render (fix)

Prompt-ID: P-2026-10-21-0715
Chat: C-2026-10-20-2055
Front: hw-notation
Lane: full (UI of the codegen pilot; small fix)
Status: eseguito 2026-10-21 · lane bv-codepanel · dc4b0626e
Request: none (project chat without a shareable URL; Alfonso's words are kept locally through `lane-run start --request`)
Depends: P-2026-10-20-2350
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-bvpanel`, branch `bv-codepanel`, cut from `alfonso-frontend-jjtl` at the commit that adds this
prompt. Check `pwd`, branch, `git log -1`, `git status`; otherwise stop. Link `frontend/node_modules` (P14), remove it at
the end. Heavy tier (RC-16), effort `high`. Single phase.

## Lane discipline

Every reply opens with `[P-2026-10-21-0715 · session <id>]`; every final message ends with one line
`Outcome: done | hard-stop | question | blocked`. Time limit 45 minutes. Read only the functions you edit.

## COSA

Found by lane P-2026-10-21-0640: the code panel of the code generation pilot calls `JSON.stringify` on run results and
arguments, and a JjEL bit-vector (S1, `frontend/src/jjel/evaluator/builtins/bitvectors.ts`) carries a `BigInt`, which
`JSON.stringify` cannot serialize: the render throws.

1. `frontend/src/codegen/ui/CodePanel.tsx` line 582 (result `<pre>`) and line 97 (call arguments): serialize through one
   small helper that prints a bit-vector in its Verilog form (`toVerilog`, e.g. `8'hff`), any other `bigint` as its
   decimal text, and everything else exactly as today (`JSON.stringify(value, null, 2)` for the result).
2. `frontend/src/codegen/ui/checkView.ts`: the same helper wherever it stringifies a value.
3. Put the helper where both files can import it under `frontend/src/codegen/ui/` (new file allowed), with a unit test:
   a vector, a nested object holding a vector, a plain bigint, and an ordinary object whose output must be byte-identical
   to today's.

## DOVE

`CodePanel.tsx`, `checkView.ts`, the helper and its test, all under `frontend/src/codegen/ui/`. Nothing else under
`frontend/src`; no critical-zone file; no change to `bitvectors.ts`. Docs closure: the Status line; one entry in
`docs/log-inbox/jjel-bitvector.md` (§21.3 taxonomy, `Causa: —`, Notes at most 500 characters); close the ticket of
this defect if `lane-run ticket` filed it in `docs/log-inbox/hw-notation.md` (P-2026-10-21-0640 or -0700), else say so;
`npm run check:docs` green.

## COME

Gates: typecheck 0 through `node scripts/run-quiet.mjs`; `npx vitest run src/codegen` green; `npm run build`. One
`fix(codegen): ...` commit and one docs closure commit, `git add` by path, `Model:` trailer. No push, no merge. Do not
name the industrial partner.
